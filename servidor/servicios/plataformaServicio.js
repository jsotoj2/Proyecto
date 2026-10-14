import { errorUsuario, texto, validarCuenta, hashPassword, usuarioPublico } from './autenticacionServicio.js';
import { numero, fechaHorario, privilegio, exigirAspirante, buscarSolicitud, buscarBeca } from './validaciones.js';

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
    }
    return vista;
}

export class PlataformaServicio {
    constructor(repositorio) { this.repositorio = repositorio; }

    async estado(actor) {
        const { datos, usuarios, version } = await this.repositorio.leerEstado();
        return vistaEstado(datos, usuarios, actor, version);
    }

    async accion(actor, accion) {
        if (!Number.isSafeInteger(accion.version) || accion.version < 0) errorUsuario('La versión del estado debe ser un entero válido.');
        let nuevoUsuario;
        if (accion.tipo === 'crear-usuario') {
            privilegio(actor, true);
            if (!['admin', 'aspirante'].includes(accion.usuario?.rol)) errorUsuario('Rol no permitido.');
            nuevoUsuario = validarCuenta(accion.usuario, accion.usuario.rol, accion.usuario.rol === 'aspirante');
            nuevoUsuario.password_hash = await hashPassword(accion.usuario.password);
        }
        await this.repositorio.transaccion(async transaccion => {
            const { datos, version } = await transaccion.leerEstadoBloqueado();
            if (accion.version !== Number(version)) errorUsuario('Los datos cambiaron. Actualiza la sección y vuelve a intentarlo.', 409);
            const usuario = await transaccion.buscarUsuario(actor.usuario);
            if (!usuario?.activo) errorUsuario('La cuenta está desactivada.', 401);
            actor = usuarioPublico(usuario);
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
                    registrar(`${actor.nombre} creó la beca ${nombre}.`);
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
                    solicitud.fase2 = this.decision(accion);
                    registrar(`${actor.nombre} revisó el formulario de ${accion.usuario}.`);
                    break;
                }
                case 'horario': {
                    privilegio(actor);
                    if (fechaHorario(accion.fecha, accion.hora) <= Date.now()) errorUsuario('El horario debe estar en el futuro.');
                    if (!['Presencial', 'Virtual'].includes(accion.modalidad)) errorUsuario('Modalidad no válida.');
                    if (datos.horarios.some(h => h.fecha === accion.fecha && h.hora === accion.hora)) errorUsuario('Ese horario ya existe.', 409);
                    datos.horarios.push({ id: Math.max(0, ...datos.horarios.map(h => h.id)) + 1, fecha: accion.fecha, hora: accion.hora, modalidad: accion.modalidad, ocupado: false, usuario: '' });
                    break;
                }
                case 'reservar':
                    this.reservar(datos, actor, accion.horarioId);
                    break;
                case 'entrevista': {
                    privilegio(actor);
                    const solicitud = buscarSolicitud(datos, accion.usuario);
                    if (solicitud.fase2.estado !== 'aceptada' || solicitud.entrevista.estado !== 'programada') errorUsuario('Primero debe programarse la entrevista.', 409);
                    solicitud.entrevista.estado = 'realizada';
                    break;
                }
                case 'fase4':
                    this.resultado(datos, actor, accion);
                    registrar(`${actor.nombre} guardó la decisión final de ${accion.usuario}.`);
                    break;
                case 'cupos': {
                    privilegio(actor, true);
                    const beca = buscarBeca(datos, accion.becaId);
                    const cupos = numero(accion.cupos, 'Cupos', 0, 100000, true);
                    if (cupos < datos.solicitudes.filter(s => s.becaId === beca.id && s.fase4.estado === 'aceptada').length) errorUsuario('Los cupos no pueden ser menores que las becas otorgadas.');
                    beca.cupos = cupos;
                    break;
                }
                case 'crear-usuario':
                    privilegio(actor, true);
                    await transaccion.crearUsuario(nuevoUsuario);
                    break;
                case 'activar-usuario': {
                    privilegio(actor, true);
                    if (typeof accion.activo !== 'boolean') errorUsuario('Estado de usuario no válido.');
                    if (accion.usuario === actor.usuario) errorUsuario('No puedes desactivar tu propia cuenta.');
                    const objetivo = await transaccion.buscarUsuario(accion.usuario);
                    if (!objetivo) errorUsuario('Usuario inexistente.', 404);
                    if (objetivo.rol === 'superadmin') errorUsuario('No se modifica otra cuenta superadministradora desde este panel.', 403);
                    await transaccion.activarUsuario(objetivo.id, accion.activo);
                    break;
                }
                default: errorUsuario('Operación no reconocida.');
            }
            datos.actividad = datos.actividad.slice(0, 500);
            await transaccion.guardarEstado(datos, Number(version) + 1, actividades);
        });
        return this.estado(actor);
    }

    guardarFormulario(datos, actor, accion) {
        exigirAspirante(actor);
        if (!/^\d{13}$/.test(actor.dpi)) errorUsuario('Tu cuenta necesita un DPI válido.');
        const beca = buscarBeca(datos, accion.becaId);
        const entrada = accion.formulario ?? {};
        const formulario = {
            nombre: actor.nombre,
            edad: String(numero(entrada.edad, 'Edad', 14, 100, true)),
            promedio: String(numero(entrada.promedio, 'Promedio', 0, 100))
        };
        for (const [campo, maximo] of [['telefono', 40], ['direccion', 500], ['estudios', 300], ['motivo', 3000]]) formulario[campo] = texto(entrada[campo], campo, maximo);
        let solicitud = datos.solicitudes.find(s => s.usuario === actor.usuario);
        if (solicitud && solicitud.fase2.estado !== 'pendiente') errorUsuario('El formulario ya fue revisado y no puede modificarse.', 409);
        if (!solicitud) {
            solicitud = {
                id: Math.max(0, ...datos.solicitudes.map(s => s.id)) + 1,
                usuario: actor.usuario, dpi: actor.dpi, fechaFormulario: new Date().toISOString().slice(0, 10),
                fase2: { estado: 'pendiente', comentario: '' },
                entrevista: { estado: 'pendiente', fecha: '', hora: '', modalidad: '' },
                fase4: { estado: 'pendiente', comentario: '' }
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
        const decision = this.decision(accion);
        const otorgadas = datos.solicitudes.filter(s => s.id !== solicitud.id && s.becaId === beca.id && s.fase4.estado === 'aceptada').length;
        if (decision.estado === 'aceptada' && otorgadas >= beca.cupos) errorUsuario('No existen cupos disponibles.', 409);
        solicitud.fase4 = decision;
    }
}
