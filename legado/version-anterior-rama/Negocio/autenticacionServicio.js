import {randomBytes, scrypt, timingSafeEqual, createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derivar = promisify(scrypt);
export function errorUsuario(mensaje, estado=400) { const error=new Error(mensaje);error.estado=estado;throw error; }
export function texto(valor, nombre, max=2000, min=1) {
  if(typeof valor!=='string'||valor.trim().length<min||valor.trim().length>max) errorUsuario(`${nombre}: revisa el valor ingresado.`);
  return valor.trim();
}
export function validarCuenta(datos, rol='aspirante', requireDpi=true) {
  const usuario=texto(datos.usuario,'Usuario',40,3).toLowerCase();
  if(!/^[a-z0-9_.-]+$/.test(usuario))errorUsuario('El usuario admite letras, números, punto, guion y guion bajo.');
  const nombre=texto(datos.nombre,'Nombre',160,2),correo=texto(datos.correo,'Correo',254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))errorUsuario('Ingresa un correo válido.');
  const dpi=datos.dpi?texto(datos.dpi,'DPI',13):null;
  if((requireDpi&&!dpi)||(dpi&&!/^\d{13}$/.test(dpi)))errorUsuario('El DPI debe contener 13 dígitos.');
  validarPassword(datos.password);
  return {usuario,nombre,correo,dpi,rol,activo:true};
}
export function validarPassword(password) {
  if(typeof password!=='string'||password.length<8||Buffer.byteLength(password)>256)errorUsuario('La contraseña debe tener al menos 8 caracteres y máximo 256 bytes.');
}
export async function hashPassword(password) {
  const salt=randomBytes(16).toString('hex');
  const hash=await derivar(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});
  return `scrypt$${salt}$${hash.toString('hex')}`;
}
export async function verificarPassword(password, guardado) {
  if(typeof password!=='string'||Buffer.byteLength(password)>256)return false;
  const [,salt,hash]=guardado.split('$');
  const actual=await derivar(password,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024});
  const esperado=Buffer.from(hash,'hex');return esperado.length===actual.length&&timingSafeEqual(esperado,actual);
}
export const hashToken=token=>createHash('sha256').update(token).digest('hex');
export const usuarioPublico=u=>({id:Number(u.id),usuario:u.usuario,nombre:u.nombre,correo:u.correo,dpi:u.dpi||'',rol:u.rol,activo:Boolean(u.activo)});
export class AutenticacionServicio {
  constructor(repo){this.repo=repo;}
  async registrar(datos){const usuario=validarCuenta(datos);return usuarioPublico(await this.repo.crearUsuario({...usuario,password_hash:await hashPassword(datos.password)}));}
  async iniciar(datos){const nombre=typeof datos.usuario==='string'?datos.usuario.trim().toLowerCase():'';const u=await this.repo.buscarUsuario(nombre);
    const dummy='scrypt$00000000000000000000000000000000$'+'00'.repeat(64);
    const correcto=await verificarPassword(datos.password,u?.password_hash||dummy);
    if(!u||!u.activo||!correcto)errorUsuario('Usuario o contraseña incorrectos.',401);
    const token=randomBytes(32).toString('hex');await this.repo.crearSesion(hashToken(token),u.id,new Date(Date.now()+8*3600000));return {token,usuario:usuarioPublico(u)};
  }
  async sesion(token){if(!/^[a-f0-9]{64}$/.test(token||''))return null;const u=await this.repo.buscarSesion(hashToken(token));return u?usuarioPublico(u):null;}
  async salir(token){if(token)await this.repo.borrarSesion(hashToken(token));}
  async cuenta(actor,datos){const nombre=texto(datos.nombre,'Nombre',160,2),correo=texto(datos.correo,'Correo',254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))errorUsuario('Ingresa un correo válido.');let hash=null;if(datos.password){validarPassword(datos.password);hash=await hashPassword(datos.password);}await this.repo.actualizarUsuario(actor.id,{nombre,correo,password_hash:hash});return usuarioPublico(await this.repo.buscarUsuario(actor.usuario));}
}
