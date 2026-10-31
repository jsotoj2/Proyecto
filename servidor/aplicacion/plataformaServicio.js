import { errorUsuario } from '../compartido/errorAplicacion.js';
import { usuarioPublico } from '../negocio/cuentas.js';
import { exigirAspirante } from '../negocio/validaciones.js';
import { SolicitudesReglas, estadoSolicitud, formatoMonto, MONTO_SEGUNDA_APROBACION } from '../negocio/solicitudesReglas.js';
import { ejecutarBecas, validarAsignacionComite } from '../negocio/becasReglas.js';
import { ejecutarEntrevistas } from '../negocio/entrevistasReglas.js';
import { prepararUsuario, ejecutarUsuarios } from './usuariosServicio.js';
import { correoDeEtapa, tieneAviso } from '../infraestructura/correo/plantillas.js';
export { MONTO_SEGUNDA_APROBACION, estadoSolicitud } from '../negocio/solicitudesReglas.js';

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
        this.solicitudes = new SolicitudesReglas();
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
        const nuevoUsuario = await prepararUsuario(actor, accion);
        let correosEncolados = false;
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
                const contexto = { datos, actor, accion, registrar };
                if (['crear-beca', 'cupos'].includes(accion.tipo)) ejecutarBecas(contexto);
                else if (['horario', 'reservar', 'entrevista'].includes(accion.tipo)) ejecutarEntrevistas(contexto, this.solicitudes);
                else if (['crear-usuario', 'activar-usuario'].includes(accion.tipo)) await ejecutarUsuarios({ ...contexto, transaccion, nuevoUsuario });
                else if (accion.tipo === 'asignar-comite') {
                    const beca = validarAsignacionComite(datos, actor, accion);
                    await transaccion.asignarComite(beca.id, accion.tipoComite);
                    registrar(`${actor.nombre} asignó la beca ${beca.nombre} al comité ${accion.tipoComite}.`);
                } else this.solicitudes.ejecutar(contexto);
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

}
