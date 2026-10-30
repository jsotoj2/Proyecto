import { errorUsuario, texto } from '../servicios/autenticacionServicio.js';
import { leerCuerpo, leerJson, obtenerToken, establecerCookie, responderArchivo, responderJson } from './http.js';

// Las rutas declaran la intención; el servicio comprueba permisos y reglas de negocio.
export const operaciones = Object.freeze({
    'POST /becas': 'crear-beca',
    'POST /solicitudes': 'formulario',
    'POST /descargas': 'descarga',
    'POST /revisiones': 'fase2',
    'POST /horarios': 'horario',
    'POST /reservas': 'reservar',
    'POST /entrevistas/completar': 'entrevista',
    'POST /resultados': 'fase4',
    'POST /aprobaciones': 'segunda-aprobacion',
    'PATCH /cupos': 'cupos',
    'POST /usuarios': 'crear-usuario',
    'PATCH /usuarios/estado': 'activar-usuario',
    'POST /becas/comite': 'asignar-comite',
'POST /becas/:id/comite': 'asignar-comite',
});

export function crearRutas({ autenticacion, plataforma, repositorio, origen, cookieSegura = false }) {
    const intentos = new Map();
    function limitar(peticion) {
        const ahora = Date.now();
        for (const [clave, valor] of intentos) if (valor.hasta <= ahora) intentos.delete(clave);
        const clave = peticion.socket.remoteAddress;
        if (!intentos.has(clave)) {
            if (intentos.size >= 10000) errorUsuario('Servicio ocupado. Intenta más tarde.', 429);
            intentos.set(clave, { cantidad: 0, hasta: ahora + 60000 });
        }
        if (++intentos.get(clave).cantidad > 15) errorUsuario('Demasiados intentos. Espera un minuto.', 429);
    }

    return async (peticion, respuesta, url) => {
        if (!url.pathname.startsWith('/api/plataforma/')) return false;
        const ruta = url.pathname.slice('/api/plataforma'.length);
        const metodo = peticion.method;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) {
            if (peticion.headers['sec-fetch-site'] === 'cross-site' || (peticion.headers.origin && peticion.headers.origin !== origen)) errorUsuario('Origen no permitido.', 403);
        }
        if (metodo === 'POST' && ['/registro', '/login'].includes(ruta)) {
            limitar(peticion);
            const datos = await leerJson(peticion);
            if (ruta === '/registro') {
                responderJson(respuesta, 201, { usuario: await autenticacion.registrar(datos) });
            } else {
                const sesion = await autenticacion.iniciar(datos);
                await autenticacion.salir(obtenerToken(peticion));
                establecerCookie(respuesta, sesion.token, cookieSegura);
                responderJson(respuesta, 200, { usuario: sesion.usuario });
            }
            return true;
        }
        const actor = await autenticacion.sesion(obtenerToken(peticion));
        if (!actor) errorUsuario('Inicia sesión para continuar.', 401);
        let resultado;
        if (metodo === 'GET' && ruta === '/sesion') resultado = { usuario: actor };
        else if (metodo === 'GET' && ruta === '/estado') resultado = await plataforma.estado(actor);
        else if (metodo === 'POST' && ruta === '/logout') {
            await autenticacion.salir(obtenerToken(peticion));
            establecerCookie(respuesta, '', cookieSegura);
            resultado = { ok: true };
        } else if (metodo === 'PATCH' && ruta === '/notificaciones/leidas') resultado = await plataforma.leerNotificaciones(actor);
        else if (['PATCH', 'POST'].includes(metodo) && ruta === '/cuenta') resultado = { usuario: await autenticacion.cuenta(actor, await leerJson(peticion)) };
        else if (operaciones[`${metodo} ${ruta}`]) {
            const datos = await leerJson(peticion);
            resultado = await plataforma.accion(actor, { ...datos, tipo: operaciones[`${metodo} ${ruta}`] });
        } else if (metodo === 'POST' && ruta === '/accion') {
            // Compatibilidad temporal para clientes anteriores, con las mismas validaciones.
            respuesta.setHeader('Deprecation', 'true');
            resultado = await plataforma.accion(actor, await leerJson(peticion));
        } else if (metodo === 'GET' && ruta === '/documentos') resultado = await repositorio.documentos(actor);
        else if (/^\/pdf\/[1-9]\d*$/.test(ruta)) {
            const id = Number(ruta.slice(5));
            if (!Number.isSafeInteger(id)) errorUsuario('Identificador de documento no válido.');
            if (metodo === 'GET') {
                responderArchivo(respuesta, await repositorio.documento(actor, id));
                return true;
            }
            if (metodo !== 'POST') errorUsuario('Método no permitido.', 405);
            if (actor.rol !== 'aspirante') errorUsuario('Solo un aspirante puede adjuntar documentos.', 403);
            if (peticion.headers['content-type'] !== 'application/pdf') errorUsuario('Se requiere application/pdf.', 415);
            const contenido = await leerCuerpo(peticion, 5 * 1024 * 1024);
            const nombre = texto(decodeURIComponent(peticion.headers['x-file-name'] ?? ''), 'Nombre de archivo', 255);
            if (!nombre.toLowerCase().endsWith('.pdf') || contenido.subarray(0, 5).toString() !== '%PDF-') errorUsuario('Selecciona un PDF válido.');
            await repositorio.guardarDocumento(actor, id, nombre, contenido);
            resultado = { ok: true };
        } else errorUsuario('Operación no encontrada.', 404);
        responderJson(respuesta, 200, resultado);
        return true;
    };
}
