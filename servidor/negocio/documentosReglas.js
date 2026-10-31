import { errorUsuario } from '../compartido/errorAplicacion.js';
import { texto } from './cuentas.js';
import { exigirAspirante } from './validaciones.js';

export function validarPdf(actor, nombre, contenido) {
    exigirAspirante(actor);
    nombre = texto(nombre, 'Nombre de archivo', 255);
    if (!nombre.toLowerCase().endsWith('.pdf') || contenido.subarray(0, 5).toString() !== '%PDF-') errorUsuario('Selecciona un PDF válido.');
    return nombre;
}

export function exigirSolicitudEditable(actor, solicitud) {
    if (!solicitud || Number(solicitud.usuario_id) !== actor.id || solicitud.revision !== 'pendiente') errorUsuario('El PDF requiere una solicitud propia sin revisar.', 403);
}

export const puedeConsultarDocumento = (actor, documento) => Boolean(documento) &&
    (actor.rol !== 'aspirante' || Number(documento.usuario_id) === actor.id);
