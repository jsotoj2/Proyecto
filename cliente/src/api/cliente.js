/* Cliente HTTP de la API. El servidor comprueba permisos y validaciones; aquí solo se traduce la comunicación. */
const BASE = '/api/plataforma/';
const LIMITE_ESPERA_MS = 20000;

// Cada operación del panel tiene una ruta explícita en la API.
export const OPERACIONES = Object.freeze({
    'crear-beca': ['POST', 'becas'],
    formulario: ['POST', 'solicitudes'],
    descarga: ['POST', 'descargas'],
    fase2: ['POST', 'revisiones'],
    horario: ['POST', 'horarios'],
    reservar: ['POST', 'reservas'],
    entrevista: ['POST', 'entrevistas/completar'],
    fase4: ['POST', 'resultados'],
    'segunda-aprobacion': ['POST', 'aprobaciones'],
    cupos: ['PATCH', 'cupos'],
    'crear-usuario': ['POST', 'usuarios'],
    'activar-usuario': ['PATCH', 'usuarios/estado']
});

export class ErrorApi extends Error {
    constructor(mensaje, estado) {
        super(mensaje);
        this.name = 'ErrorApi';
        this.estado = estado;
    }
}

// Rutas cuya respuesta 401 es parte del flujo normal y no indica una sesión caducada.
const RUTAS_SIN_SESION = new Set(['login', 'registro', 'sesion']);
let alCaducarSesion = null;

export function configurarSesionCaducada(manejador) {
    alCaducarSesion = manejador;
}

export async function peticion(ruta, opciones = {}) {
    let respuesta;
    try {
        respuesta = await fetch(BASE + ruta, { credentials: 'same-origin', signal: AbortSignal.timeout(LIMITE_ESPERA_MS), ...opciones });
    } catch (error) {
        throw new ErrorApi(error.name === 'TimeoutError'
            ? 'El servidor tardó demasiado en responder. Consulta el estado antes de volver a enviar.'
            : 'No se pudo conectar con el servidor. Revisa tu conexión.', 0);
    }
    let datos;
    try { datos = await respuesta.json(); } catch { throw new ErrorApi('El servidor devolvió una respuesta no válida.', respuesta.status); }
    if (!respuesta.ok) {
        if (respuesta.status === 401 && !RUTAS_SIN_SESION.has(ruta)) alCaducarSesion?.();
        throw new ErrorApi(datos.error || 'No se pudo completar la operación.', respuesta.status);
    }
    return datos;
}

export function api(ruta, datos, metodo = 'POST') {
    if (datos === undefined) return peticion(ruta);
    return peticion(ruta, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
}

export function subirPdf(solicitudId, archivo) {
    return peticion('pdf/' + solicitudId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf', 'X-File-Name': encodeURIComponent(archivo.name) },
        body: archivo
    });
}

export const urlDocumento = solicitudId => BASE + 'pdf/' + encodeURIComponent(solicitudId);
