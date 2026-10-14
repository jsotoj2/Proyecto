import readline from 'node:readline';
import { Writable } from 'node:stream';
import fs from 'node:fs/promises';
import { validarCuenta, hashPassword } from '../servidor/servicios/autenticacionServicio.js';
import { PlataformaRepositorio } from '../servidor/repositorios/plataformaRepositorio.js';

let conexion;
let interfaz;
try {
    if (!process.stdin.isTTY) throw new Error('Ejecuta este comando en una terminal interactiva para proteger la contraseña.');
    let ocultar = false;
    const salida = new Writable({ write(parte, codificacion, siguiente) { if (!ocultar) process.stdout.write(parte); siguiente(); } });
    salida.isTTY = true;
    salida.columns = process.stdout.columns;
    interfaz = readline.createInterface({ input: process.stdin, output: salida, terminal: true });
    const preguntar = pregunta => new Promise(resolve => interfaz.question(pregunta, resolve));
    const usuario = await preguntar('Usuario administrador: ');
    const nombre = await preguntar('Nombre completo: ');
    const correo = await preguntar('Correo electrónico: ');
    const rol = (await preguntar('Rol [superadmin/admin; predeterminado superadmin]: ')).trim() || 'superadmin';
    if (!['admin', 'superadmin'].includes(rol)) throw new Error('El rol debe ser admin o superadmin.');
    process.stdout.write('Contraseña (mínimo 8 caracteres, escritura oculta): ');
    ocultar = true;
    const password = await preguntar('');
    ocultar = false;
    process.stdout.write('\nRepite la contraseña: ');
    ocultar = true;
    const confirmacion = await preguntar('');
    ocultar = false;
    process.stdout.write('\n');
    if (password !== confirmacion) throw new Error('Las contraseñas no coinciden.');
    const cuenta = validarCuenta({ usuario, nombre, correo, password }, rol, false);
    cuenta.password_hash = await hashPassword(password);
    if (process.argv.includes('--exportar-sql')) {
        // Los literales hexadecimales evitan depender del modo de escape de MySQL.
        const literal = valor => `CONVERT(0x${Buffer.from(valor).toString('hex')} USING utf8mb4)`;
        const sql = `-- Selecciona la base migrada en DBeaver. No contiene la contraseña en texto plano.\nSTART TRANSACTION;\nINSERT INTO usuarios_app (usuario,nombre,correo,password_hash,rol,activo) VALUES (${[cuenta.usuario,cuenta.nombre,cuenta.correo,cuenta.password_hash,rol].map(literal).join(',')},1);\nCOMMIT;\nSELECT id,usuario,nombre,rol,activo FROM administradores;\n`;
        await fs.writeFile(new URL('../administrador.local.sql', import.meta.url), sql, { flag: 'wx', mode: 0o600 });
        console.log('SQL generado en administrador.local.sql. No lo publiques. Usa ese archivo en tu base migrada.');
    } else {
        const { crearConexion } = await import('../servidor/configuracion/conexion.js');
        conexion = crearConexion();
        const repositorio = new PlataformaRepositorio(conexion);
        await repositorio.comprobarEsquema();
        await repositorio.transaccion(async transaccion => {
            await transaccion.conexion.execute('SELECT version FROM control_plataforma WHERE id=1 FOR UPDATE');
            if (rol === 'superadmin' && await transaccion.haySuperadmin()) throw new Error('Ya existe un superadministrador activo. Utiliza su panel para crear administradores.');
            await transaccion.crearUsuario(cuenta);
            await transaccion.conexion.execute('UPDATE control_plataforma SET version=version+1 WHERE id=1');
        });
        console.log('Administrador creado. Inicia sesión con el usuario y contraseña que acabas de indicar.');
    }
} catch (error) {
    console.error('No se pudo crear el administrador:', error.code ?? error.message);
    process.exitCode = 1;
} finally {
    interfaz?.close();
    if (conexion) await conexion.end();
}
