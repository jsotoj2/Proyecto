import { errorUsuario, texto, validarCuenta, hashPassword, usuarioPublico } from './autenticacionServicio.js';
import { numero, fechaHorario, privilegio, exigirAspirante, buscarSolicitud, buscarBeca } from './validaciones.js';
import { correoDeEtapa, tieneAviso } from '../correo/plantillas.js';

// Las solicitudes que superan este monto requieren la aprobación de un segundo administrador.
export const MONTO_SEGUNDA_APROBACION = 10000;
export const formatoMonto = valor => 'Q' + Number(valor).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Operaciones que cambian o modifican una solicitud; cada una queda en la bitácora.
const OPERACIONES_SOLICITUD = new Set(['formulario', 'fase2', 'reservar', 'entrevista', 'fase4', 'segunda-aprobacion']);
const AVISOS = {
    'formulario-enviado': 'Recibimos tu formulario de solicitud.',
    'revision-aceptada': 'Tu formulario fue aprobado. Ya puedes reservar tu entrevista.',
    'revision-rechazada': 'Tu formulario no fue aprobado. Consulta el comentario de la revisión.',
    'entrevista-programada': 'Tu entrevista quedó programada.',
    'entrevista-realizada': 'Tu entrevista fue registrada como realizada.',
    'resultado-pendiente_aprobacion': `Tu solicitud fue aprobada y, por superar ${formatoMonto(MONTO_SEGUNDA_APROBACION)}, pasa a una segunda aprobación.`,
    'resultado-aceptada': '¡Felicidades! Tu beca fue autorizada.',
    'resultado-rechazada': 'Tu solicitud de beca no fue aprobada. Consulta el comentario del resultado.'
};

// Resume la fase más avanzada; un cambio de este valor genera una notificación.
export function estadoSolicitud(solicitud) {
    if (!solicitud) return 'sin-solicitud';
    if (solicitud.fase4.estado !== 'pendiente') return 'resultado-' + solicitud.fase4.estado;
    if (solicitud.entrevista.estado !== 'pendiente') return 'entrevista-' + solicitud.entrevista.estado;
    if (solicitud.fase2.estado !== 'pendiente') return 'revision-' + solicitud.fase2.estado;
    return 'formulario-enviado';
}

// Las solicitudes en segunda aprobación reservan su cupo para no otorgar más becas de las disponibles.
const cuposOcupados = (datos, becaId, excluirId) => datos.solicitudes.filter(s => s.id !== excluirId && s.becaId === becaId && ['aceptada', 'pendiente_aprobacion'].includes(s.fase4.estado)).length;
const usuarioObjetivo = (actor, accion) => ['formulario', 'reservar'].includes(accion.tipo) ? actor.usuario : typeof accion.usuario === 'string' ? accion.usuario.slice(0, 40) : null;

export function vistaEstado(datos, usuarios, actor, version) {
    const vista = structuredClone(datos);
    vista.usuarios = usuarios.map(usuarioPublico);
    vista.version = Number(version);
    if (actor.rol === 'aspirante') {
        vista.usuarios = vista.usuarios.filter(usuario => usuario.usuario === actor.usuario);
        vista.solicitudes = vista.solicitudes.filter(solicitud => solicitud.usuario === actor.usuario);
        vista.descargas = vista.descargas.filter(descarga => descarga.usuario === actor.usuario);
        vista.actividad = [];
        vista.horarios = vista.horarios.map(horario => ({ ...horario, usuario: horario.usuario === actor.usuario ? horario.usuario : '' }));
        // El aspirante no ve qué administrador revisó o aprobó su solicitud.
        for (const solicitud of vista.solicitudes) {
            delete solicitud.fase2.revisadoPor;
            delete solicitud.fase4.aprobadoPor;
            delete solicitud.fase4.segundoAprobador;
        }
    }
    return vista;
}

export class PlataformaServicio {
    /**
     * `urlPanel`: dirección pública de la interfaz, usada en los enlaces de los correos.
     * `alEncolarCorreos`: se llama tras confirmar una transacción que dejó correos en la bandeja de salida.
     */
    constructor(repositorio, { urlPanel = '', alEncolarCorreos = () => {} } = {}) {
        this.repositorio = repositorio;
        this.urlPanel = urlPanel.replace(/\/$/, '');
        this.alEncolarCorreos = alEncolarCorreos;
    }

    async estado(actor) {
        const { datos, usuarios, version } = await this.repositorio.leerEstado();
        const vista = vistaEstado(datos, usuarios, actor, version);
        if (actor.rol === 'aspirante') vista.notificaciones = await this.repositorio.notificaciones(actor.usuario);
        else vista.auditoria = await this.repositorio.auditoria();
        return vista;
    }

    async leerNotificaciones(actor) {
        exigirAspirante(actor);
        await this.repositorio.marcarNotificacionesLeidas(actor.usuario);
        return this.estado(actor);
    }

    // Un intento rechazado revierte la transacción; se registra aparte para conservar quién lo intentó.
    async auditarRechazo(actor, accion, error) {
        try {
            await this.repositorio.registrarAuditoria([{
                solicitudId: null, usuarioSolicitud: usuarioObjetivo(actor, accion), actorId: actor.id, actorUsuario: actor.usuario, actorRol: actor.rol,
                operacion: accion.tipo, estadoAnterior: null, estadoNuevo: null, resultado: 'rechazado', detalle: String(error.message).slice(0, 2000), fecha: new Date().toISOString()
            }]);
        } catch { /* La bitácora no debe ocultar el error original. */ }
    }

    async accion(actor, accion) {
        if (!Number.isSafeInteger(accion.version) || accion.version < 0) errorUsuario('La versión del estado debe ser un entero válido.');
        let nuevoUsuario;
        let correosEncolados = false;
        if (accion.tipo === 'crear-usuario') {
            privilegio(actor, true);
            if (!['admin', 'aspirante'].includes(accion.usuario?.rol)) errorUsuario('Rol no permitido.');
            nuevoUsuario = validarCuenta(accion.usuario, accion.usuario.rol, accion.usuario.rol === 'aspirante');
            nuevoUsuario.password_hash = await hashPassword(accion.usuario.password);
        }
        const actorSesion = actor;
        try {
            await this.repositorio.transaccion(async transaccion => {
                const { datos, version } = await transaccion.leerEstadoBloqueado();
                if (accion.version !== Number(version)) errorUsuario('Los datos cambiaron. Actualiza la sección y vuelve a intentarlo.', 409);
                const usuario = await transaccion.buscarUsuario(actor.usuario);
                if (!usuario?.activo) errorUsuario('La cuenta está desactivada.', 401);
                actor = usuarioPublico(usuario);
                const objetivo = usuarioObjetivo(actor, accion);
                const estadoAnterior = estadoSolicitud(datos.solicitudes.find(s => s.usuario === objetivo));
                const actividades = [];
                const registrar = mensaje => {
                    const evento = { texto: mensaje, fecha: new Date().toLocaleDateString('es-GT', { timeZone: 'America/Guatemala' }) };
                    actividades.push(evento);
                    datos.actividad.unshift(evento);
                };
                switch (accion.tipo) {
                    case 'crear-beca': {
                        privilegio(actor, true);
                        const nombre = texto(accion.nombre, 'Nombre de la beca', 160, 3);
                        const descripcion = texto(accion.descripcion, 'Descripción', 3000, 10);
                        const cupos = numero(accion.cupos, 'Cupos', 0, 100000, true);
                        if (!Array.isArray(accion.requisitos) || !accion.requisitos.length || accion.requisitos.length > 30) errorUsuario('Incluye entre 1 y 30 requisitos.');
                        const requisitos = accion.requisitos.map(requisito => texto(requisito, 'Requisito', 500));
                        const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
                        if (datos.becas.some(beca => normalizar(beca.nombre) === normalizar(nombre))) errorUsuario('Ya existe una beca con ese nombre.', 409);
                        // La versión y el bloqueo transaccional evitan identificadores duplicados.
                        const id = Math.max(0, ...datos.becas.map(beca => beca.id)) + 1;
                        datos.becas.push({ id, nombre, descripcion, requisitos, cupos });
                        registrar(`${actor.nombre} creó la beca ${nombre} con ${cupos} cupos.`);
                        break;
                    }
                    case 'descarga': {
                        exigirAspirante(actor);
                        const beca = buscarBeca(datos, accion.becaId);
                        if (!datos.descargas.some(d => d.usuario === actor.usuario && d.becaId === beca.id)) datos.descargas.push({ usuario: actor.usuario, becaId: beca.id, fecha: new Date().toISOString().slice(0, 10) });
                        break;
                    }
                    case 'formulario':
                        this.guardarFormulario(datos, actor, accion);
                        registrar(`${actor.nombre} envió su formulario.`);
                        break;
                    case 'fase2': {
                        privilegio(actor);
                        const solicitud = buscarSolicitud(datos, accion.usuario);
                        if (solicitud.entrevista.fecha || solicitud.fase4.estado !== 'pendiente') errorUsuario('La solicitud ya avanzó a otra fase.', 409);
                        solicitud.fase2 = { ...this.decision(accion), revisadoPor: actor.usuario };
                        registrar(`${actor.nombre} revisó el formulario de ${accion.usuario}.`);
                        break;
                    }
                    case 'horario': {
                        privilegio(actor);
                        if (fechaHorario(accion.fecha, accion.hora) <= Date.now()) errorUsuario('El horario debe estar en el futuro.');
                        if (!['Presencial', 'Virtual'].includes(accion.modalidad)) errorUsuario('Modalidad no válida.');
                        if (datos.horarios.some(h => h.fecha === accion.fecha && h.hora === accion.hora)) errorUsuario('Ese horario ya existe.', 409);
                        datos.horarios.push({ id: Math.max(0, ...datos.horarios.map(h => h.id)) + 1, fecha: accion.fecha, hora: accion.hora, modalidad: accion.modalidad, ocupado: false, usuario: '' });
                        registrar(`${actor.nombre} publicó un horario de entrevista (${accion.fecha} ${accion.hora}, ${accion.modalidad}).`);
                        break;
                    }
                    case 'reservar':
                        this.reservar(datos, actor, accion.horarioId);
                        registrar(`${actor.nombre} reservó su entrevista.`);
                        break;
                    case 'entrevista': {
                        privilegio(actor);
                        const solicitud = buscarSolicitud(datos, accion.usuario);
                        if (solicitud.fase2.estado !== 'aceptada' || solicitud.entrevista.estado !== 'programada') errorUsuario('Primero debe programarse la entrevista.', 409);
                        solicitud.entrevista.estado = 'realizada';
                        registrar(`${actor.nombre} registró la entrevista de ${accion.usuario} como realizada.`);
                        break;
                    }
                    case 'fase4':
                        this.resultado(datos, actor, accion);
                        registrar(`${actor.nombre} guardó la decisión final de ${accion.usuario}.`);
                        break;
                    case 'segunda-aprobacion':
                        this.segundaAprobacion(datos, actor, accion);
                        registrar(`${actor.nombre} realizó la segunda aprobación de ${accion.usuario}.`);
                        break;
                    case 'cupos': {
                        privilegio(actor, true);
                        const beca = buscarBeca(datos, accion.becaId);
                        const cupos = numero(accion.cupos, 'Cupos', 0, 100000, true);
                        if (cupos < cuposOcupados(datos, beca.id)) errorUsuario('Los cupos no pueden ser menores que las becas otorgadas o en segunda aprobación.');
                        beca.cupos = cupos;
                        registrar(`${actor.nombre} cambió los cupos de ${beca.nombre} a ${cupos}.`);
                        break;
                    }
                    case 'crear-usuario':
                        privilegio(actor, true);
                        await transaccion.crearUsuario(nuevoUsuario);
                        registrar(`${actor.nombre} creó la cuenta ${nuevoUsuario.usuario} (${nuevoUsuario.rol}).`);
                        break;
                    case 'activar-usuario': {
                        privilegio(actor, true);
                        if (typeof accion.activo !== 'boolean') errorUsuario('Estado de usuario no válido.');
                        if (accion.usuario === actor.usuario) errorUsuario('No puedes desactivar tu propia cuenta.');
                        const objetivo = await transaccion.buscarUsuario(accion.usuario);
                        if (!objetivo) errorUsuario('Usuario inexistente.', 404);
                        if (objetivo.rol === 'superadmin') errorUsuario('No se modifica otra cuenta superadministradora desde este panel.', 403);
                        await transaccion.activarUsuario(objetivo.id, accion.activo);
                        registrar(`${actor.nombre} ${accion.activo ? 'activó' : 'desactivó'} la cuenta ${objetivo.usuario}.`);
                        break;
                    }
                    default: errorUsuario('Operación no reconocida.');
                }
                datos.actividad = datos.actividad.slice(0, 500);
                // Los datos se guardan primero: la bitácora, los avisos y los correos hacen referencia a la solicitud.
                await transaccion.guardarEstado(datos, Number(version) + 1);
                const descripcion = actividades.map(a => a.texto).join(' ');
                if (OPERACIONES_SOLICITUD.has(accion.tipo)) {
                    correosEncolados = await this.auditarCambio(transaccion, datos, actor, accion, objetivo, estadoAnterior, descripcion);
                } else if (descripcion) {
                    await transaccion.registrarAuditoria([{
                        solicitudId: null, usuarioSolicitud: null, actorId: actor.id, actorUsuario: actor.usuario, actorRol: actor.rol,
                        operacion: accion.tipo, estadoAnterior: null, estadoNuevo: null, resultado: 'exito', descripcion, detalle: '', fecha: new Date().toISOString()
                    }]);
                }
            });
        } catch (error) {
            if (error.estado && OPERACIONES_SOLICITUD.has(accion.tipo)) await this.auditarRechazo(actorSesion, accion, error);
            throw error;
        }
        // El envío ocurre fuera de la transacción: un fallo del correo nunca revierte el cambio de etapa.
        if (correosEncolados) this.alEncolarCorreos();
        return this.estado(actor);
    }

    // Se escribe en la misma transacción que el cambio: si este se revierte, no queda un registro falso
    // ni se envía un correo. Devuelve true si dejó un correo en la bandeja de salida.
    async auditarCambio(transaccion, datos, actor, accion, objetivo, estadoAnterior, descripcion = '') {
        const solicitud = datos.solicitudes.find(s => s.usuario === objetivo);
        const estadoNuevo = estadoSolicitud(solicitud);
        const fecha = new Date().toISOString();
        const detalles = {
            formulario: () => `${datos.becas.find(b => b.id === solicitud.becaId)?.nombre ?? 'Beca'} · monto solicitado ${formatoMonto(solicitud.formulario.monto)}`,
            fase2: () => solicitud.fase2.comentario,
            reservar: () => `${solicitud.entrevista.fecha} ${solicitud.entrevista.hora} · ${solicitud.entrevista.modalidad}`,
            entrevista: () => 'Entrevista marcada como realizada.',
            fase4: () => solicitud.fase4.comentario,
            'segunda-aprobacion': () => solicitud.fase4.comentario
        };
        await transaccion.registrarAuditoria([{
            solicitudId: solicitud.id, usuarioSolicitud: solicitud.usuario, actorId: actor.id, actorUsuario: actor.usuario, actorRol: actor.rol,
            operacion: accion.tipo, estadoAnterior, estadoNuevo, resultado: 'exito', descripcion, detalle: detalles[accion.tipo]().slice(0, 2000), fecha
        }]);
        if (estadoNuevo === estadoAnterior || !AVISOS[estadoNuevo]) return false;
        await transaccion.crearNotificaciones([{ usuario: solicitud.usuario, solicitudId: solicitud.id, mensaje: AVISOS[estadoNuevo], fecha }]);
        const aspirante = await transaccion.buscarUsuario(solicitud.usuario);
        if (!aspirante?.correo || !tieneAviso(estadoNuevo)) return false;
        const correo = correoDeEtapa(estadoNuevo, {
            nombre: aspirante.nombre,
            beca: datos.becas.find(b => b.id === solicitud.becaId)?.nombre,
            solicitud,
            enlace: this.urlPanel && `${this.urlPanel}/panel/solicitud`
        });
        await transaccion.encolarCorreos([{ usuario: solicitud.usuario, destinatario: aspirante.correo, ...correo }]);
        return true;
    }

    guardarFormulario(datos, actor, accion) {
        exigirAspirante(actor);
        if (!/^\d{13}$/.test(actor.dpi)) errorUsuario('Tu cuenta necesita un DPI válido.');
        const beca = buscarBeca(datos, accion.becaId);
        const entrada = accion.formulario ?? {};
        const formulario = {
            nombre: actor.nombre,
            edad: String(numero(entrada.edad, 'Edad', 14, 100, true)),
            promedio: String(numero(entrada.promedio, 'Promedio', 0, 100)),
            monto: String(Math.round(numero(entrada.monto, 'Monto solicitado', 1, 10000000) * 100) / 100)
        };
        for (const [campo, maximo] of [['telefono', 40], ['direccion', 500], ['estudios', 300], ['motivo', 3000]]) formulario[campo] = texto(entrada[campo], campo, maximo);
        if (!/^\d{8}$/.test(formulario.telefono)) errorUsuario('El teléfono debe tener exactamente 8 dígitos.');
        let solicitud = datos.solicitudes.find(s => s.usuario === actor.usuario);
        if (solicitud && solicitud.fase2.estado !== 'pendiente') errorUsuario('El formulario ya fue revisado y no puede modificarse.', 409);
        if (!solicitud) {
            solicitud = {
                id: Math.max(0, ...datos.solicitudes.map(s => s.id)) + 1,
                usuario: actor.usuario, dpi: actor.dpi, fechaFormulario: new Date().toISOString().slice(0, 10),
                fase2: { estado: 'pendiente', comentario: '', revisadoPor: '' },
                entrevista: { estado: 'pendiente', fecha: '', hora: '', modalidad: '' },
                fase4: { estado: 'pendiente', comentario: '', aprobadoPor: '', segundoAprobador: '' }
            };
            datos.solicitudes.push(solicitud);
        }
        Object.assign(solicitud, { becaId: beca.id, formularioEnviado: true, formulario });
    }

    reservar(datos, actor, horarioId) {
        exigirAspirante(actor);
        const solicitud = buscarSolicitud(datos, actor.usuario);
        if (solicitud.fase2.estado !== 'aceptada' || solicitud.entrevista.fecha) errorUsuario('La entrevista requiere revisión aprobada y ninguna reserva previa.', 409);
        const horario = datos.horarios.find(h => h.id === Number(horarioId));
        if (!horario || horario.ocupado || fechaHorario(horario.fecha, horario.hora) <= Date.now()) errorUsuario('El horario ya no está disponible.', 409);
        horario.ocupado = true;
        horario.usuario = actor.usuario;
        solicitud.entrevista = { fecha: horario.fecha, hora: horario.hora, modalidad: horario.modalidad, estado: 'programada' };
    }

    decision(accion) {
        if (!['aceptada', 'rechazada'].includes(accion.estado)) errorUsuario('Estado no permitido.');
        return { estado: accion.estado, comentario: texto(accion.comentario, 'Comentario', 2000) };
    }

    resultado(datos, actor, accion) {
        privilegio(actor);
        const solicitud = buscarSolicitud(datos, accion.usuario);
        const beca = buscarBeca(datos, solicitud.becaId);
        if (solicitud.fase2.estado !== 'aceptada' || solicitud.entrevista.estado !== 'realizada') errorUsuario('Primero debe aprobarse el formulario y realizarse la entrevista.', 409);
        if (solicitud.fase4.estado === 'pendiente_aprobacion') errorUsuario('La solicitud espera la segunda aprobación.', 409);
        const decision = this.decision(accion);
        if (decision.estado === 'aceptada' && cuposOcupados(datos, beca.id, solicitud.id) >= beca.cupos) errorUsuario('No existen cupos disponibles.', 409);
        const requiereSegunda = decision.estado === 'aceptada' && Number(solicitud.formulario?.monto) > MONTO_SEGUNDA_APROBACION;
        solicitud.fase4 = { ...decision, estado: requiereSegunda ? 'pendiente_aprobacion' : decision.estado, aprobadoPor: decision.estado === 'aceptada' ? actor.usuario : '', segundoAprobador: '' };
    }

    segundaAprobacion(datos, actor, accion) {
        privilegio(actor);
        const solicitud = buscarSolicitud(datos, accion.usuario);
        if (solicitud.fase4.estado !== 'pendiente_aprobacion') errorUsuario('La solicitud no está pendiente de segunda aprobación.', 409);
        if (solicitud.fase4.aprobadoPor === actor.usuario) errorUsuario('La segunda aprobación debe realizarla un administrador distinto al primero.', 403);
        const decision = this.decision(accion);
        if (decision.estado === 'aceptada' && cuposOcupados(datos, solicitud.becaId, solicitud.id) >= buscarBeca(datos, solicitud.becaId).cupos) errorUsuario('No existen cupos disponibles.', 409);
        solicitud.fase4 = { ...decision, aprobadoPor: solicitud.fase4.aprobadoPor, segundoAprobador: actor.usuario };
    }
}
