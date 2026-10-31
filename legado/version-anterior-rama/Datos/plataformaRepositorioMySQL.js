import fs from 'node:fs/promises';
const parse=valor=>typeof valor==='string'?JSON.parse(valor):valor;
export class PlataformaRepositorioMySQL {
 constructor(conexion){this.conexion=conexion;}
 async preparar(){
   const schema=await fs.readFile(new URL('../Backend/esquemaPlataforma.sql',import.meta.url),'utf8');
   for(const sql of schema.split(';').map(s=>s.trim()).filter(Boolean))await this.conexion.query(sql);
   const inicial=JSON.parse(await fs.readFile(new URL('./estadoInicial.json',import.meta.url),'utf8'));
   await this.conexion.execute('INSERT INTO estado_plataforma (id,version,datos) VALUES (1,0,?) ON DUPLICATE KEY UPDATE id=id',[JSON.stringify(inicial)]);
 }
 async buscarUsuario(usuario){const [rows]=await this.conexion.execute('SELECT * FROM usuarios_app WHERE usuario=?',[usuario]);return rows[0]||null;}
 async crearUsuario(u){
   const [result]=await this.conexion.execute('INSERT INTO usuarios_app (usuario,nombre,correo,dpi,password_hash,rol,activo) VALUES (?,?,?,?,?,?,?)',[u.usuario,u.nombre,u.correo,u.dpi,u.password_hash,u.rol,u.activo]);
   return {...u,id:Number(result.insertId)};
 }
 async actualizarUsuario(id,u){
   await this.transaccion(async tx=>{await tx.conexion.execute('UPDATE usuarios_app SET nombre=?,correo=?,password_hash=COALESCE(?,password_hash) WHERE id=?',[u.nombre,u.correo,u.password_hash,id]);if(u.password_hash)await tx.conexion.execute('DELETE FROM sesiones_app WHERE usuario_id=?',[id]);});
 }
 async activarUsuario(id,activo){await this.conexion.execute('UPDATE usuarios_app SET activo=? WHERE id=?',[activo,id]);if(!activo)await this.conexion.execute('DELETE FROM sesiones_app WHERE usuario_id=?',[id]);}
 async crearSesion(hash,id,expira){await this.conexion.execute('DELETE FROM sesiones_app WHERE expira < UTC_TIMESTAMP(3)');await this.conexion.execute('INSERT INTO sesiones_app (token_hash,usuario_id,expira) VALUES (?,?,?)',[hash,id,expira]);}
 async buscarSesion(hash){const [rows]=await this.conexion.execute('SELECT u.* FROM usuarios_app u JOIN sesiones_app s ON s.usuario_id=u.id WHERE s.token_hash=? AND s.expira>UTC_TIMESTAMP(3) AND u.activo=1',[hash]);return rows[0]||null;}
 async borrarSesion(hash){await this.conexion.execute('DELETE FROM sesiones_app WHERE token_hash=?',[hash]);}
 async leerEstado(){const [rows]=await this.conexion.execute('SELECT datos,version FROM estado_plataforma WHERE id=1');const [usuarios]=await this.conexion.execute('SELECT id,usuario,nombre,correo,dpi,rol,activo FROM usuarios_app');return {datos:parse(rows[0].datos),version:rows[0].version,usuarios};}
 async leerEstadoBloqueado(){const [rows]=await this.conexion.execute('SELECT datos,version FROM estado_plataforma WHERE id=1 FOR UPDATE');return {datos:parse(rows[0].datos),version:rows[0].version};}
 async guardarEstado(datos,version){await this.conexion.execute('UPDATE estado_plataforma SET datos=?,version=? WHERE id=1',[JSON.stringify(datos),version]);}
 async transaccion(operacion){const c=await this.conexion.getConnection();try{await c.beginTransaction();const resultado=await operacion(new PlataformaRepositorioMySQL(c));await c.commit();return resultado;}catch(e){await c.rollback();throw e;}finally{c.release();}}
 async previas(actor){
   const donde=actor.rol==='aspirante'?' WHERE e.cui=?':'';
   const [rows]=await this.conexion.execute('SELECT s.expediente,s.estado,b.nombre AS beca,e.nombre AS postulante,e.cui,d.nombre AS documento FROM solicitudes s JOIN estudiantes e ON e.id=s.estudiante_id JOIN becas b ON b.id=s.beca_id LEFT JOIN documentos d ON d.expediente=s.expediente'+donde,actor.rol==='aspirante'?[actor.dpi]:[]);return rows;
 }
 async documentoPrevio(actor,expediente){const [rows]=await this.conexion.execute('SELECT d.nombre,d.tipo,d.contenido,e.cui FROM documentos d JOIN solicitudes s ON s.expediente=d.expediente JOIN estudiantes e ON e.id=s.estudiante_id WHERE d.expediente=?',[expediente]);const d=rows[0];return d&&(actor.rol!=='aspirante'||d.cui===actor.dpi)?d:null;}
 async guardarDocumento(actor,id,nombre,contenido){
   await this.transaccion(async tx=>{const {datos}=await tx.leerEstadoBloqueado();const s=datos.solicitudes.find(s=>s.id===Number(id)&&s.usuario===actor.usuario);if(!s||s.fase2.estado!=='pendiente'){const e=new Error('El PDF requiere una solicitud propia sin revisar.');e.estado=403;throw e;}
     await tx.conexion.execute('INSERT INTO documentos_plataforma (solicitud_id,usuario_id,nombre,tipo,contenido) VALUES (?,?,?,\'application/pdf\',?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),contenido=VALUES(contenido)',[s.id,actor.id,nombre,contenido]);
   });
 }
 async documento(actor,id){const [rows]=await this.conexion.execute('SELECT usuario_id,nombre,tipo,contenido FROM documentos_plataforma WHERE solicitud_id=?',[id]);const d=rows[0];return d&&(actor.rol!=='aspirante'||Number(d.usuario_id)===actor.id)?d:null;}
 async documentos(actor){const [rows]=await this.conexion.execute('SELECT solicitud_id,nombre FROM documentos_plataforma'+(actor.rol==='aspirante'?' WHERE usuario_id=?':''),actor.rol==='aspirante'?[actor.id]:[]);return rows;}
 async haySuperadmin(){const [rows]=await this.conexion.execute("SELECT id FROM usuarios_app WHERE rol='superadmin' AND activo=1 LIMIT 1");return rows.length>0;}
}
