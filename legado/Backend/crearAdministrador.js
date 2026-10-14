import readline from 'node:readline';
import {Writable} from 'node:stream';
import {PlataformaRepositorioMySQL} from '../Datos/plataformaRepositorioMySQL.js';
import {validarCuenta,hashPassword} from '../Negocio/autenticacionServicio.js';
let conexion,rl;
try{
 ({conexion}=await import('./conexion.js'));const repo=new PlataformaRepositorioMySQL(conexion);await repo.preparar();
 if(await repo.haySuperadmin())throw new Error('Ya existe un superadministrador. Crea otras cuentas desde su panel.');
 let ocultar=false;const salida=new Writable({write(chunk,encoding,callback){if(!ocultar)process.stdout.write(chunk);callback();}});salida.isTTY=process.stdout.isTTY;salida.columns=process.stdout.columns;
 rl=readline.createInterface({input:process.stdin,output:salida,terminal:Boolean(process.stdin.isTTY)});
 const preguntar=texto=>new Promise(resolve=>rl.question(texto,resolve));
 const usuario=await preguntar('Usuario de superadministrador: '),nombre=await preguntar('Nombre completo: '),correo=await preguntar('Correo: ');
 process.stdout.write('Contraseña (mínimo 8 caracteres, se oculta al escribir): ');ocultar=true;const password=await preguntar('');ocultar=false;process.stdout.write('\n');
 process.stdout.write('Repite la contraseña: ');ocultar=true;const confirmar=await preguntar('');ocultar=false;process.stdout.write('\n');
 if(password!==confirmar)throw new Error('Las contraseñas no coinciden.');
 const cuenta=validarCuenta({usuario,nombre,correo,password},'superadmin',false);cuenta.password_hash=await hashPassword(password);
 await repo.transaccion(async tx=>{await tx.leerEstadoBloqueado();if(await tx.haySuperadmin())throw new Error('Ya existe un superadministrador.');await tx.crearUsuario(cuenta);});
 console.log('Superadministrador creado. Ya puedes iniciar sesión en la aplicación.');
}catch(e){console.error(e.code==='ER_DUP_ENTRY'?'El usuario o correo ya existe.':e.code?'No se pudo crear la cuenta. Código: '+e.code:e.message);process.exitCode=1;}
finally{rl?.close();if(conexion)await conexion.end();}
