import { errorUsuario } from './autenticacionServicio.js';

export function numero(valor, nombre, minimo, maximo, entero = false) {
    if (!['string', 'number'].includes(typeof valor) || String(valor).trim() === '') errorUsuario(`${nombre}: ingresa un número.`);
    const resultado = Number(valor);
    if (!Number.isFinite(resultado) || resultado < minimo || resultado > maximo || (entero && !Number.isInteger(resultado))) errorUsuario(`${nombre}: valor fuera de rango.`);
    return resultado;
}

export function fechaHorario(fecha, hora) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) errorUsuario('Selecciona una fecha y hora válidas.');
    const calendario = new Date(fecha + 'T00:00:00Z');
    if (!Number.isFinite(+calendario) || calendario.toISOString().slice(0, 10) !== fecha) errorUsuario('La fecha no existe en el calendario.');
    // Las entrevistas usan la hora de Guatemala, independientemente del servidor.
    return new Date(`${fecha}T${hora}:00-06:00`);
}

export function privilegio(actor, superadministrador = false) {
    const permitido = superadministrador ? actor.rol === 'superadmin' : ['admin', 'superadmin'].includes(actor.rol);
    if (!permitido) errorUsuario('No tienes permiso para esta operación.', 403);
}

export function exigirAspirante(actor) {
    if (actor.rol !== 'aspirante') errorUsuario('Esta operación corresponde a un aspirante.', 403);
}

export function buscarSolicitud(datos, usuario) {
    const solicitud = datos.solicitudes.find(item => item.usuario === usuario);
    if (!solicitud) errorUsuario('No existe una solicitud para ese usuario.', 404);
    return solicitud;
}

export function buscarBeca(datos, id) {
    const beca = datos.becas.find(item => item.id === Number(id));
    if (!beca) errorUsuario('La beca no existe.', 404);
    return beca;
}
