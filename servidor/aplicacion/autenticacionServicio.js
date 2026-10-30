import { randomBytes } from 'node:crypto';
import { errorUsuario } from '../compartido/errorAplicacion.js';
import { validarCuenta, validarNombre, validarCorreo, validarPassword, usuarioPublico } from '../negocio/cuentas.js';
import { hashPassword, verificarPassword, hashToken } from '../infraestructura/seguridad.js';

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
        const nombre = validarNombre(datos.nombre);
        const correo = validarCorreo(datos.correo);
        let hash = null;
        if (datos.password) { validarPassword(datos.password); hash = await hashPassword(datos.password); }
        await this.repositorio.actualizarUsuario(actor.id, { nombre, correo, password_hash: hash });
        return usuarioPublico(await this.repositorio.buscarUsuario(actor.usuario));
    }
}
