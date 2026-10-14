import {errorUsuario,texto,validarCuenta,hashPassword,usuarioPublico} from './autenticacionServicio.js';
function privilegio(actor,superadmin=false){if(superadmin?actor.rol!=='superadmin':!['admin','superadmin'].includes(actor.rol))errorUsuario('No tienes permiso para esta operación.',403);}
function numero(valor,nombre,min,max){const n=Number(valor);if(!Number.isFinite(n)||n<min||n>max)errorUsuario(`${nombre}: valor fuera de rango.`);return n;}
function solicitud(datos,usuario){const s=datos.solicitudes.find(s=>s.usuario===usuario);if(!s)errorUsuario('No existe una solicitud para ese usuario.',404);return s;}
function beca(datos,id){const b=datos.becas.find(b=>b.id===Number(id));if(!b)errorUsuario('La beca no existe.',404);return b;}
export function vistaEstado(datos,usuarios,actor,version){
 const vista=structuredClone(datos);vista.usuarios=usuarios.map(usuarioPublico);vista.version=Number(version);
 if(actor.rol==='aspirante'){
   vista.usuarios=vista.usuarios.filter(u=>u.usuario===actor.usuario);
   vista.solicitudes=vista.solicitudes.filter(s=>s.usuario===actor.usuario);
   vista.descargas=vista.descargas.filter(d=>d.usuario===actor.usuario);
   vista.actividad=[];
   vista.horarios=vista.horarios.map(h=>({...h,usuario:h.usuario===actor.usuario?h.usuario:''}));
 }
 return vista;
}
export class PlataformaServicio {
 constructor(repo){this.repo=repo;}
 async estado(actor){const {datos,version,usuarios}=await this.repo.leerEstado();return vistaEstado(datos,usuarios,actor,version);}
 async accion(actor,a){
   let nuevoUsuario;
   if(a.tipo==='crear-usuario'){privilegio(actor,true);if(!['admin','aspirante'].includes(a.usuario?.rol))errorUsuario('Rol no permitido.');nuevoUsuario=validarCuenta(a.usuario,a.usuario.rol,a.usuario.rol==='aspirante');nuevoUsuario.password_hash=await hashPassword(a.usuario.password);}
   await this.repo.transaccion(async tx=>{
     const {datos,version}=await tx.leerEstadoBloqueado();
     if(Number(a.version)!==Number(version))errorUsuario('Los datos cambiaron. Actualiza la sección y vuelve a intentarlo.',409);
     const u=await tx.buscarUsuario(actor.usuario);if(!u?.activo)errorUsuario('La cuenta está desactivada.',401);
     actor=usuarioPublico(u);
     const actividad=mensaje=>datos.actividad.unshift({texto:mensaje,fecha:new Date().toLocaleDateString('es-GT')});
     switch(a.tipo){
       case 'descarga':{
         if(actor.rol!=='aspirante')errorUsuario('Solo un aspirante puede registrar una descarga.',403);
         const b=beca(datos,a.becaId);if(!datos.descargas.some(d=>d.usuario===actor.usuario&&d.becaId===b.id))datos.descargas.push({usuario:actor.usuario,becaId:b.id,fecha:new Date().toISOString().slice(0,10)});break;
       }
       case 'formulario':{
         if(actor.rol!=='aspirante')errorUsuario('Solo un aspirante puede enviar su formulario.',403);
         if(!/^\d{13}$/.test(actor.dpi))errorUsuario('Tu cuenta necesita un DPI válido. Solicita al administrador que complete tu registro.');
         const b=beca(datos,a.becaId), f=a.formulario||{};
         numero(f.edad,'Edad',14,100);numero(f.promedio,'Promedio',0,100);
         const formulario={nombre:actor.nombre,edad:String(f.edad),promedio:String(f.promedio)};
         for(const [key,max] of [['telefono',40],['direccion',500],['estudios',300],['motivo',3000]])formulario[key]=texto(f[key],key,max);
         let s=datos.solicitudes.find(s=>s.usuario===actor.usuario);
         if(s&&s.fase2.estado!=='pendiente')errorUsuario('El formulario ya fue revisado y no puede modificarse.',409);
         if(!s){s={id:Math.max(0,...datos.solicitudes.map(s=>s.id))+1,usuario:actor.usuario,dpi:actor.dpi,becaId:b.id,fechaFormulario:new Date().toISOString().slice(0,10),formularioEnviado:true,formulario:{},fase2:{estado:'pendiente',comentario:''},entrevista:{fecha:'',hora:'',modalidad:'',estado:'pendiente'},fase4:{estado:'pendiente',comentario:''}};datos.solicitudes.push(s);}
         s.becaId=b.id;s.formulario=formulario;s.formularioEnviado=true;actividad(`${actor.nombre} envió su formulario.`);break;
       }
       case 'fase2':{
         privilegio(actor);const s=solicitud(datos,a.usuario);if(s.entrevista.fecha||s.fase4.estado!=='pendiente')errorUsuario('La solicitud ya avanzó a otra fase.',409);
         if(!['aceptada','rechazada'].includes(a.estado))errorUsuario('Estado no permitido.');s.fase2={estado:a.estado,comentario:texto(a.comentario,'Comentario',2000)};actividad(`${actor.nombre} revisó el formulario de ${a.usuario}.`);break;
       }
       case 'horario':{
         privilegio(actor);if(!/^\d{4}-\d{2}-\d{2}$/.test(a.fecha)||!/^\d{2}:\d{2}$/.test(a.hora))errorUsuario('Selecciona una fecha y hora válidas.');
         const d=new Date(`${a.fecha}T${a.hora}:00`);if(!Number.isFinite(+d)||d<Date.now())errorUsuario('El horario debe estar en el futuro.');
         if(!['Presencial','Virtual'].includes(a.modalidad))errorUsuario('Modalidad no válida.');
         if(datos.horarios.some(h=>h.fecha===a.fecha&&h.hora===a.hora))errorUsuario('Ese horario ya existe.',409);
         datos.horarios.push({id:Math.max(0,...datos.horarios.map(h=>h.id))+1,fecha:a.fecha,hora:a.hora,modalidad:a.modalidad,ocupado:false,usuario:''});break;
       }
       case 'reservar':{
         if(actor.rol!=='aspirante')errorUsuario('Solo un aspirante puede reservar.',403);const s=solicitud(datos,actor.usuario);
         if(s.fase2.estado!=='aceptada'||s.entrevista.fecha)errorUsuario('La entrevista requiere Fase 2 aprobada y ninguna reserva previa.',409);
         const h=datos.horarios.find(h=>h.id===Number(a.horarioId));if(!h||h.ocupado||new Date(`${h.fecha}T${h.hora}:00`)<Date.now())errorUsuario('El horario ya no está disponible.',409);
         h.ocupado=true;h.usuario=actor.usuario;s.entrevista={fecha:h.fecha,hora:h.hora,modalidad:h.modalidad,estado:'programada'};break;
       }
       case 'entrevista':{
         privilegio(actor);const s=solicitud(datos,a.usuario);if(s.fase2.estado!=='aceptada'||s.entrevista.estado!=='programada')errorUsuario('Primero debe programarse la entrevista.',409);s.entrevista.estado='realizada';break;
       }
       case 'fase4':{
         privilegio(actor);const s=solicitud(datos,a.usuario),b=beca(datos,s.becaId);if(!['aceptada','rechazada'].includes(a.estado))errorUsuario('Estado no válido.');
         if(s.fase2.estado!=='aceptada'||s.entrevista.estado!=='realizada')errorUsuario('Primero debe aprobarse el formulario y realizarse la entrevista.',409);
         if(a.estado==='aceptada'&&datos.solicitudes.filter(x=>x.id!==s.id&&x.becaId===b.id&&x.fase4.estado==='aceptada').length>=b.cupos)errorUsuario('No existen cupos disponibles.',409);
         s.fase4={estado:a.estado,comentario:texto(a.comentario,'Comentario',2000)};actividad(`${actor.nombre} guardó la decisión final de ${a.usuario}.`);break;
       }
       case 'cupos':{
         privilegio(actor,true);const b=beca(datos,a.becaId),n=numero(a.cupos,'Cupos',0,100000);if(!Number.isInteger(n))errorUsuario('Los cupos deben ser enteros.');if(n<datos.solicitudes.filter(s=>s.becaId===b.id&&s.fase4.estado==='aceptada').length)errorUsuario('Los cupos no pueden ser menores que las becas otorgadas.');b.cupos=n;break;
       }
       case 'crear-usuario':privilegio(actor,true);await tx.crearUsuario(nuevoUsuario);break;
       case 'activar-usuario':{
         privilegio(actor,true);if(typeof a.activo!=='boolean')errorUsuario('Estado de usuario no válido.');if(a.usuario===actor.usuario)errorUsuario('No puedes desactivar tu propia cuenta.');const target=await tx.buscarUsuario(a.usuario);if(!target)errorUsuario('Usuario inexistente.',404);if(target.rol==='superadmin')errorUsuario('No se modifica otra cuenta superadministradora desde este panel.',403);await tx.activarUsuario(target.id,Boolean(a.activo));break;
       }
       default:errorUsuario('Operación no reconocida.');
     }
     datos.actividad=datos.actividad.slice(0,500);await tx.guardarEstado(datos,Number(version)+1);
   });
   return this.estado(actor);
 }
}
