import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { responderJson } from './http.js';

const publico = fileURLToPath(new URL('../../publico/', import.meta.url));
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };

export function crearAplicacion({ rutas, comprobarConexion, registrarError = console.error }) {
    return async (peticion, respuesta) => {
        const identificador = randomUUID();
        respuesta.setHeader('X-Request-Id', identificador);
        respuesta.setHeader('X-Content-Type-Options', 'nosniff');
        respuesta.setHeader('X-Frame-Options', 'DENY');
        respuesta.setHeader('Referrer-Policy', 'same-origin');
        respuesta.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        try {
            const url = new URL(peticion.url, 'http://localhost');
            if (await rutas(peticion, respuesta, url)) return;
            if (url.pathname === '/api/salud' && peticion.method === 'GET') {
                await comprobarConexion();
                return responderJson(respuesta, 200, { estado: 'ok' });
            }
            if (url.pathname.startsWith('/api/')) return responderJson(respuesta, 404, { error: 'Operación no encontrada.' });
            if (!['GET', 'HEAD'].includes(peticion.method)) return responderJson(respuesta, 405, { error: 'Método no permitido.' });
            let recurso = decodeURIComponent(url.pathname);
            if (recurso === '/') recurso = '/index.html';
            // Mantiene los enlaces anteriores, sin publicar archivos del servidor ni de legado.
            recurso = recurso.replace(/^\/Frontend\//, '/');
            const archivo = path.resolve(publico, '.' + recurso);
            const relativo = path.relative(publico, archivo);
            if (relativo.startsWith('..') || path.isAbsolute(relativo) || !tipos[path.extname(archivo)]) return responderJson(respuesta, 404, { error: 'Archivo no encontrado.' });
            let contenido;
            try { contenido = await fs.readFile(archivo); } catch { return responderJson(respuesta, 404, { error: 'Archivo no encontrado.' }); }
            respuesta.writeHead(200, { 'Content-Type': tipos[path.extname(archivo)] + '; charset=utf-8', 'Cache-Control': 'no-cache' });
            respuesta.end(peticion.method === 'HEAD' ? undefined : contenido);
        } catch (error) {
            if (respuesta.writableEnded || respuesta.destroyed) return;
            let estado = error.estado ?? 500;
            let mensaje = error.estado ? error.message : 'No se pudo completar la operación.';
            if (error instanceof URIError) { estado = 400; mensaje = 'La dirección no es válida.'; }
            if (error.code === 'ER_DUP_ENTRY') { estado = 409; mensaje = 'Ya existe un registro con esos datos.'; }
            if (['ECONNREFUSED','ETIMEDOUT','PROTOCOL_CONNECTION_LOST','ER_CON_COUNT_ERROR'].includes(error.code)) { estado = 503; mensaje = 'La base de datos no está disponible temporalmente.'; }
            if (estado >= 500) registrarError({ identificador, codigo: error.code ?? error.name });
            if (estado === 429) respuesta.setHeader('Retry-After', '60');
            responderJson(respuesta, estado, { error: mensaje, identificador });
        }
    };
}
