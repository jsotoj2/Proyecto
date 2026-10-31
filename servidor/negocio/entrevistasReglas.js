import { errorUsuario } from '../compartido/errorAplicacion.js';
import { fechaHorario, privilegio, buscarSolicitud } from './validaciones.js';

export function ejecutarEntrevistas({ datos, actor, accion, registrar }, solicitudes) {
    switch (accion.tipo) {
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
            solicitudes.reservar(datos, actor, accion.horarioId);
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

        default: errorUsuario('Operación de entrevistas no reconocida.');
    }
}
