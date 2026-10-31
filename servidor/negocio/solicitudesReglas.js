import { errorUsuario } from '../compartido/errorAplicacion.js';
import { texto } from './cuentas.js';
import { numero, fechaHorario, privilegio, exigirAspirante, buscarSolicitud, buscarBeca } from './validaciones.js';

// Las solicitudes que superan este monto requieren la aprobación de un segundo administrador.
export const MONTO_SEGUNDA_APROBACION = 10000;
export const formatoMonto = valor => 'Q' + Number(valor).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Resume la fase más avanzada; un cambio de este valor genera una notificación.
export function estadoSolicitud(solicitud) {
    if (!solicitud) return 'sin-solicitud';
    if (solicitud.fase4.estado !== 'pendiente') return 'resultado-' + solicitud.fase4.estado;
    if (solicitud.entrevista.estado !== 'pendiente') return 'entrevista-' + solicitud.entrevista.estado;
    if (solicitud.fase2.estado !== 'pendiente') return 'revision-' + solicitud.fase2.estado;
    return 'formulario-enviado';
}

// Las solicitudes en segunda aprobación reservan su cupo para no otorgar más becas de las disponibles.
export const cuposOcupados = (datos, becaId, excluirId) => datos.solicitudes.filter(s => s.id !== excluirId && s.becaId === becaId && ['aceptada', 'pendiente_aprobacion'].includes(s.fase4.estado)).length;

// Reglas en memoria: modifican el modelo sin acceder a HTTP, MySQL ni correo.
export class SolicitudesReglas {
    ejecutar({ datos, actor, accion, registrar }) {
        switch (accion.tipo) {
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
            case 'fase4':
                this.resultado(datos, actor, accion);
                registrar(`${actor.nombre} guardó la decisión final de ${accion.usuario}.`);
                break;
            case 'segunda-aprobacion':
                this.segundaAprobacion(datos, actor, accion);
                registrar(`${actor.nombre} realizó la segunda aprobación de ${accion.usuario}.`);
                break;

            default: errorUsuario('Operación de solicitudes no reconocida.');
        }
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
