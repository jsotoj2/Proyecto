import { errorUsuario } from '../compartido/errorAplicacion.js';

export function responderJson(respuesta, estado, datos) {
    respuesta.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    respuesta.end(JSON.stringify(datos));
}

export function leerCuerpo(peticion, limite = 64 * 1024) {
    return new Promise((resolver, rechazar) => {
        let longitud = 0;
        let excedido = false;
        const partes = [];
        peticion.on('data', parte => {
            longitud += parte.length;
            if (longitud > limite) {
                if (!excedido) {
                    excedido = true;
                    partes.length = 0;
                    const error = new Error('La solicitud supera el tamaño permitido.');
                    error.estado = 413;
                    rechazar(error);
                }
                return;
            }
            partes.push(parte);
        });
        peticion.on('end', () => { if (!excedido) resolver(Buffer.concat(partes)); });
        peticion.on('error', rechazar);
        peticion.on('aborted', () => rechazar(Object.assign(new Error('Petición interrumpida.'), { estado: 400 })));
    });
}

export async function leerJson(peticion) {
    if (!/^application\/json(?:\s*;|$)/i.test(peticion.headers['content-type'] ?? '')) errorUsuario('Se requiere application/json.', 415);
    const cuerpo = await leerCuerpo(peticion);
    let datos;
    try { datos = JSON.parse(cuerpo.toString('utf8')); } catch { errorUsuario('El JSON no es válido.'); }
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) errorUsuario('Se requiere un objeto JSON.');
    return datos;
}

export function obtenerToken(peticion) {
    return (peticion.headers.cookie ?? '').split(';').map(valor => valor.trim()).find(valor => valor.startsWith('becas_sesion='))?.slice('becas_sesion='.length) ?? '';
}

export function establecerCookie(respuesta, token, segura) {
    respuesta.setHeader('Set-Cookie', `becas_sesion=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token ? 28800 : 0}${segura ? '; Secure' : ''}`);
}

export function responderArchivo(respuesta, documento) {
    if (!documento) errorUsuario('Documento no encontrado.', 404);
    const nombre = documento.nombre.replace(/[^\w. -]/g, '_');
    respuesta.writeHead(200, {
        'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${nombre}"`,
        'Cache-Control': 'no-store', 'Content-Security-Policy': "sandbox; default-src 'none'"
    });
    respuesta.end(documento.contenido);
}
