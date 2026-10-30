import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../Frontend/', import.meta.url));
function responder(res, estado, contenido) {
    res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(contenido));
}
export function crearAplicacion(servicio, comprobarConexion, plataformaApi=null, autenticar=null) {
    return async (req, res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        try {
            const url = new URL(req.url, 'http://localhost');
            if (plataformaApi && await plataformaApi(req,res)) return;
            if (autenticar && url.pathname.startsWith('/api/solicitudes')) {
                const actor=await autenticar(req);
                if(!actor) return responder(res,401,{error:'Inicia sesión para continuar.'});
                if(req.method==='POST') return responder(res,410,{error:'Registra la solicitud desde el panel por fases.'});
                if(url.pathname==='/api/solicitudes' && actor.rol==='aspirante' && url.searchParams.get('cui')!==actor.dpi) return responder(res,403,{error:'Solo puedes consultar tus expedientes.'});
                if(url.pathname.startsWith('/api/solicitudes/') && actor.rol==='aspirante'){const s=await servicio.consultarPorExpediente(decodeURIComponent(url.pathname.slice('/api/solicitudes/'.length)));if(s && s.cui!==actor.dpi)return responder(res,403,{error:'Solo puedes consultar tus expedientes.'});}
            }
            if (req.method === 'GET' && url.pathname === '/api/salud') {
                await comprobarConexion();
                return responder(res, 200, { estado: 'ok', baseDatos: 'MySQL' });
            }
            if (req.method === 'POST' && url.pathname === '/api/solicitudes') {
                if (req.headers['sec-fetch-site'] === 'cross-site') return responder(res, 403, { error: 'Origen no permitido.' });
                if (!/^multipart\/form-data;/i.test(req.headers['content-type'] || '')) {
                    return responder(res, 415, { error: 'Envía el formulario y el PDF usando FormData.' });
                }
                const partes = [];
                let size = 0;
                const limite = 6 * 1024 * 1024;
                for await (const parte of req) {
                    size += parte.length;
                    if (size > limite) {
                        responder(res, 413, { error: 'La solicitud es demasiado grande. El PDF admite hasta 5 MB.' });
                        return;
                    }
                    partes.push(parte);
                }
                let form;
                try {
                    form = await new Response(Buffer.concat(partes), { headers: { 'Content-Type': req.headers['content-type'] } }).formData();
                } catch { return responder(res, 400, { error: 'El formulario no tiene un formato válido.' }); }
                const solicitud = await servicio.registrar({
                    nombre: form.get('nombre'), correo: form.get('correo'), cui: form.get('cui'),
                    beca: form.get('beca'), archivo: form.get('archivo')
                });
                return responder(res, 201, solicitud);
            }
            if (req.method === 'GET' && url.pathname === '/api/solicitudes') {
                return responder(res, 200, await servicio.consultarPorCui(url.searchParams.get('cui')));
            }
            if (req.method === 'GET' && url.pathname.startsWith('/api/solicitudes/')) {
                const solicitud = await servicio.consultarPorExpediente(decodeURIComponent(url.pathname.slice('/api/solicitudes/'.length)));
                return responder(res, 200, solicitud);
            }
            if (url.pathname.startsWith('/api/')) return responder(res, 404, { error: 'Operación no encontrada.' });
            if (req.method !== 'GET') return responder(res, 405, { error: 'Método no permitido.' });
            let recurso = decodeURIComponent(url.pathname);
            if (recurso === '/') { res.writeHead(302, { Location: '/Frontend/index.html' }); res.end(); return; }
            if (!recurso.startsWith('/Frontend/')) return responder(res, 404, { error: 'Archivo no encontrado.' });
            const archivo = path.resolve(frontend, recurso.slice('/Frontend/'.length));
            const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
            if (!archivo.startsWith(frontend) || !tipos[path.extname(archivo)]) return responder(res, 404, { error: 'Archivo no encontrado.' });
            let contenido;
            try { contenido = await fs.readFile(archivo); } catch { return responder(res, 404, { error: 'Archivo no encontrado.' }); }
            res.writeHead(200, { 'Content-Type': tipos[path.extname(archivo)] });
            res.end(contenido);
        } catch (error) {
            if (error.codigo === 'VALIDACION') return responder(res, 400, { error: error.message });
            if (error.codigo === 'DUPLICADA') return responder(res, 409, { error: error.message });
            console.error('Error de operación:', error.code || error.codigo || error.name);
            return responder(res, 503, { error: 'No se pudo completar la operación. Revisa la conexión del backend a MySQL.' });
        }
    };
}
