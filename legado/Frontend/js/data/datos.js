// Adaptador de la interfaz original. MySQL es la fuente de datos; no localStorage.
let datosCache=null;
const escapar=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const desescapar=s=>s.replace(/&(amp|lt|gt|quot|#39);/g,(_,c)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[c]));
function transformar(v,fn){if(typeof v==='string')return fn(v);if(Array.isArray(v))return v.map(x=>transformar(x,fn));if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,transformar(x,fn)]));return v;}
async function api(ruta,body){let response;try{response=await fetch('/api/plataforma/'+ruta,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch{throw new Error('No se pudo conectar. Abre la aplicación desde http://localhost:3000.');}const result=await response.json();if(!response.ok){if(response.status===401&&document.getElementById('dashboardPage'))location.href='index.html';throw new Error(result.error||'No se pudo completar la operación.');}return result;}
function detectarAccion(d){
 const antes=datosCache;
 const creado=d.usuarios.find(u=>!antes.usuarios.some(a=>a.usuario===u.usuario));if(creado)return {tipo:'crear-usuario',usuario:{...creado,dpi:creado.dpi||null}};
 const activo=d.usuarios.find(u=>antes.usuarios.some(a=>a.usuario===u.usuario&&a.activo!==u.activo));if(activo)return {tipo:'activar-usuario',usuario:activo.usuario,activo:activo.activo};
 const cupo=d.becas.find(b=>antes.becas.some(a=>a.id===b.id&&a.cupos!==b.cupos));if(cupo)return {tipo:'cupos',becaId:cupo.id,cupos:cupo.cupos};
 const horario=d.horarios.find(h=>!antes.horarios.some(a=>a.id===h.id));if(horario)return {tipo:'horario',fecha:horario.fecha,hora:horario.hora,modalidad:horario.modalidad};
 const descarga=d.descargas.find(x=>!antes.descargas.some(a=>a.usuario===x.usuario&&a.becaId===x.becaId));if(descarga)return {tipo:'descarga',becaId:descarga.becaId};
 for(const s of d.solicitudes){const a=antes.solicitudes.find(a=>a.usuario===s.usuario);
   if(!a||JSON.stringify(a.formulario)!==JSON.stringify(s.formulario)||a.becaId!==s.becaId)return {tipo:'formulario',becaId:s.becaId,formulario:s.formulario};
   if(JSON.stringify(a.fase2)!==JSON.stringify(s.fase2))return {tipo:'fase2',usuario:s.usuario,...s.fase2};
   if(JSON.stringify(a.fase4)!==JSON.stringify(s.fase4))return {tipo:'fase4',usuario:s.usuario,...s.fase4};
   if(JSON.stringify(a.entrevista)!==JSON.stringify(s.entrevista)){
     if(s.entrevista.estado==='realizada')return {tipo:'entrevista',usuario:s.usuario};
     const h=d.horarios.find(h=>h.usuario===s.usuario&&h.ocupado&&!antes.horarios.find(a=>a.id===h.id)?.ocupado);if(h)return {tipo:'reservar',horarioId:h.id};
   }
 }
 return null;
}
window.BecasData={
 api,escapar,
 async cargar(){datosCache=await api('estado');return this.obtener();},
 obtener(){if(!datosCache)throw new Error('Los datos todavía no se han cargado.');return transformar(structuredClone(datosCache),escapar);},
 async guardar(datos){const accion=detectarAccion(transformar(datos,desescapar));if(!accion)return;if(accion.tipo==="crear-usuario")accion.usuario.password=datos.usuarios.find(u=>u.usuario===accion.usuario.usuario).password;try{datosCache=await api('accion',{...accion,version:datosCache.version});}catch(e){await this.cargar();throw e;}},
 version(){return datosCache?.version;},
 async subirPdf(id,file){const res=await fetch('/api/plataforma/pdf/'+id,{method:'POST',headers:{'Content-Type':'application/pdf','X-File-Name':encodeURIComponent(file.name)},body:file});const data=await res.json();if(!res.ok)throw new Error(data.error);},
 reiniciar(){throw new Error('Los datos de MySQL no se borran desde el navegador.');}
};
