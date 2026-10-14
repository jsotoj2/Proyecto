import {errorUsuario,texto} from '../Negocio/autenticacionServicio.js';
const cookie=req=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('becas_sesion='))?.slice(13)||'';
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
async function cuerpo(req,limite=64*1024){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limite)errorUsuario('El archivo o la solicitud es demasiado grande.',413);chunks.push(chunk);}return Buffer.concat(chunks);}
async function leerJSON(req){if(!(req.headers['content-type']||'').startsWith('application/json'))errorUsuario('Se requiere JSON.',415);try{const datos=JSON.parse((await cuerpo(req)).toString());if(!datos||typeof datos!=='object'||Array.isArray(datos))errorUsuario('Se requiere un objeto JSON.');return datos;}catch(e){if(e.estado)throw e;errorUsuario('JSON no válido.');}}
function archivo(res,d){if(!d)errorUsuario('Documento no encontrado.',404);const nombre=d.nombre.replace(/[^\w. -]/g,'_');res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${nombre}"`,'Cache-Control':'no-store'});res.end(d.contenido);}
export function crearPlataformaApi(auth,servicio,repo){
 const intentos=new Map();
 return async(req,res)=>{
  const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/api/plataforma/'))return false;
  try{
   if(req.method!=='GET'){
    if(req.headers['sec-fetch-site']==='cross-site')errorUsuario('Origen no permitido.',403);
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)errorUsuario('Origen no permitido.',403);
   }
   const ruta=url.pathname.slice('/api/plataforma/'.length);
   if(req.method==='POST'&&['registro','login'].includes(ruta)){
     const key=req.socket.remoteAddress,ahora=Date.now();let registro=intentos.get(key);if(!registro||registro.hasta<ahora){registro={cantidad:0,hasta:ahora+60000};intentos.set(key,registro);}if(++registro.cantidad>15)errorUsuario('Demasiados intentos. Espera un minuto.',429);
     if(intentos.size>1000)for(const [k,v] of intentos)if(v.hasta<ahora)intentos.delete(k);
     const body=await leerJSON(req);
     if(ruta==='registro'){json(res,201,{usuario:await auth.registrar(body)});return true;}
     const anterior=cookie(req);if(anterior)await auth.salir(anterior);
     const sesion=await auth.iniciar(body);res.setHeader('Set-Cookie',`becas_sesion=${sesion.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);json(res,200,{usuario:sesion.usuario});return true;
   }
   const actor=await auth.sesion(cookie(req));if(!actor)errorUsuario('Inicia sesión para continuar.',401);
   if(req.method==='GET'&&ruta==='sesion'){json(res,200,{usuario:actor});return true;}
   if(req.method==='POST'&&ruta==='logout'){await auth.salir(cookie(req));res.setHeader('Set-Cookie','becas_sesion=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');json(res,200,{ok:true});return true;}
   if(req.method==='GET'&&ruta==='estado'){json(res,200,await servicio.estado(actor));return true;}
   if(req.method==='POST'&&ruta==='accion'){json(res,200,await servicio.accion(actor,await leerJSON(req)));return true;}
   if(req.method==='POST'&&ruta==='cuenta'){json(res,200,{usuario:await auth.cuenta(actor,await leerJSON(req))});return true;}
   if(req.method==='GET'&&ruta==='previas'){json(res,200,await repo.previas(actor));return true;}
   if(req.method==='GET'&&ruta.startsWith('pdf-previo/')){archivo(res,await repo.documentoPrevio(actor,decodeURIComponent(ruta.slice(11))));return true;}
   if(req.method==='GET'&&ruta==='documentos'){json(res,200,await repo.documentos(actor));return true;}
   if(ruta.startsWith('pdf/')){
     const id=ruta.slice(4);if(!/^\d+$/.test(id))errorUsuario('Documento no válido.');
     if(req.method==='GET'){archivo(res,await repo.documento(actor,id));return true;}
     if(req.method==='POST'){
       if(actor.rol!=='aspirante')errorUsuario('Solo un aspirante puede adjuntar su PDF.',403);
       if(!(req.headers['content-type']||'').startsWith('application/pdf'))errorUsuario('Se requiere un PDF.',415);
       const buffer=await cuerpo(req,5*1024*1024);const nombre=texto(decodeURIComponent(req.headers['x-file-name']||''),'Nombre del archivo',255);
       if(!nombre.toLowerCase().endsWith('.pdf')||buffer.length<5||buffer.subarray(0,5).toString()!=='%PDF-')errorUsuario('El archivo debe ser un PDF válido.');
       await repo.guardarDocumento(actor,id,nombre,buffer);json(res,200,{ok:true});return true;
     }
   }
   errorUsuario('Operación no encontrada.',404);
  }catch(e){if(e.code==='ER_DUP_ENTRY'){json(res,409,{error:'El usuario, correo o DPI ya está registrado.'});return true;}if(e.estado){json(res,e.estado,{error:e.message});return true;}console.error('Error de plataforma:',e.code||e.name);json(res,503,{error:'No se pudo completar la operación. Revisa la conexión a MySQL.'});return true;}
 };
}
