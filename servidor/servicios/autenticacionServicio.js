import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derivar = promisify(scrypt);
const parametros = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

export function errorUsuario(mensaje, estado = 400) {
    throw Object.assign(new Error(mensaje), { estado });
}

export function texto(valor, nombre, maximo = 2000, minimo = 1) {
    if (typeof valor !== 'string' || valor.trim().length < minimo || valor.trim().length > maximo) errorUsuario(`${nombre}: revisa el valor ingresado.`);
    return valor.trim();
}

export function validarPassword(password) {
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 256) errorUsuario('La contraseña debe tener al menos 8 caracteres y máximo 256 bytes.');
}

export function validarCuenta(datos, rol = 'aspirante', requiereDpi = true) {
    const usuario = texto(datos.usuario, 'Usuario', 40, 3).toLowerCase();
    if (!/^[a-z0-9_.-]+$/.test(usuario)) errorUsuario('El usuario admite letras, números, punto, guion y guion bajo.');
    const nombre = texto(datos.nombre, 'Nombre', 160, 2);
    const correo = texto(datos.correo, 'Correo', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errorUsuario('Ingresa un correo válido.');
    const dpi = datos.dpi ? texto(datos.dpi, 'DPI', 13) : null;
    if ((requiereDpi && !dpi) || (dpi && !/^\d{13}$/.test(dpi))) errorUsuario('El DPI debe contener 13 dígitos.');
    validarPassword(datos.password);
    return { usuario, nombre, correo, dpi, rol, activo: true };
}

export async function hashPassword(password) {
    const sal = randomBytes(16).toString('hex');
    const hash = await derivar(password, sal, 64, parametros);
    return `scrypt$${sal}$${hash.toString('hex')}`;
}

export async function verificarPassword(password, guardado) {
    if (typeof password !== 'string' || Buffer.byteLength(password) > 256) return false;
    if (typeof guardado !== 'string' || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(guardado)) return false;
    const [, sal, hash] = guardado.split('$');
    const actual = await derivar(password, sal, 64, parametros);
    return timingSafeEqual(Buffer.from(hash, 'hex'), actual);
}

export const hashToken = token => createHash('sha256').update(token).digest('hex');
export const usuarioPublico = usuario => ({
    id: Number(usuario.id), usuario: usuario.usuario, nombre: usuario.nombre,
    correo: usuario.correo, dpi: usuario.dpi ?? '', rol: usuario.rol, activo: Boolean(usuario.activo)
});

export class AutenticacionServicio {
    constructor(repositorio) { this.repositorio = repositorio; }

    async registrar(datos) {
        // El registro público ignora cualquier rol enviado por el navegador.
        const usuario = validarCuenta(datos);
        usuario.password_hash = await hashPassword(datos.password);
        return usuarioPublico(await this.repositorio.crearUsuario(usuario));
    }

    async iniciar(datos) {
        const nombre = typeof datos.usuario === 'string' ? datos.usuario.trim().toLowerCase() : '';
        const usuario = await this.repositorio.buscarUsuario(nombre);
        const simulado = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
        const correcto = await verificarPassword(datos.password, usuario?.password_hash ?? simulado);
        if (!usuario || !usuario.activo || !correcto) errorUsuario('Usuario o contraseña incorrectos.', 401);
        const token = randomBytes(32).toString('hex');
        await this.repositorio.crearSesion(hashToken(token), usuario.id, new Date(Date.now() + 8 * 3600000));
        return { token, usuario: usuarioPublico(usuario) };
    }

    async sesion(token) {
        if (!/^[a-f0-9]{64}$/.test(token ?? '')) return null;
        const usuario = await this.repositorio.buscarSesion(hashToken(token));
        return usuario ? usuarioPublico(usuario) : null;
    }

    async salir(token) { if (token) await this.repositorio.borrarSesion(hashToken(token)); }

    async cuenta(actor, datos) {
        const nombre = texto(datos.nombre, 'Nombre', 160, 2);
        const correo = texto(datos.correo, 'Correo', 254).toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errorUsuario('Ingresa un correo válido.');
        let hash = null;
        if (datos.password) { validarPassword(datos.password); hash = await hashPassword(datos.password); }
        await this.repositorio.actualizarUsuario(actor.id, { nombre, correo, password_hash: hash });
        return usuarioPublico(await this.repositorio.buscarUsuario(actor.usuario));
    }
}
