import { errorUsuario } from '../compartido/errorAplicacion.js';

export function texto(valor, nombre, maximo = 2000, minimo = 1) {
    if (typeof valor !== 'string' || valor.trim().length < minimo || valor.trim().length > maximo) errorUsuario(`${nombre}: revisa el valor ingresado.`);
    return valor.trim();
}

export function validarPassword(password) {
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 256) errorUsuario('La contraseña debe tener al menos 8 caracteres y máximo 256 bytes.');
}

// Las mismas reglas usa la interfaz (cliente/src/utilidades/validaciones.js).
export function validarNombre(valor) {
    const nombre = texto(valor, 'Nombre', 160, 2);
    if (!/^\p{L}+(?:[\s'’.-]+\p{L}+)*\.?$/u.test(nombre)) errorUsuario('El nombre solo admite letras y espacios, sin números ni símbolos.');
    return nombre;
}

export function validarCorreo(valor) {
    const correo = texto(valor, 'Correo', 254).toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(correo)) errorUsuario('Ingresa un correo válido.');
    return correo;
}

export function validarCuenta(datos, rol = 'aspirante', requiereDpi = true) {
    const usuario = texto(datos.usuario, 'Usuario', 40, 3).toLowerCase();
    if (!/^[a-z0-9_.-]+$/.test(usuario)) errorUsuario('El usuario admite letras, números, punto, guion y guion bajo.');
    const nombre = validarNombre(datos.nombre);
    const correo = validarCorreo(datos.correo);
    const dpi = datos.dpi ? texto(datos.dpi, 'DPI', 13) : null;
    if ((requiereDpi && !dpi) || (dpi && !/^\d{13}$/.test(dpi))) errorUsuario('El DPI debe contener 13 dígitos.');
    validarPassword(datos.password);
    return { usuario, nombre, correo, dpi, rol, activo: true };
}

export const usuarioPublico = usuario => ({
    id: Number(usuario.id), usuario: usuario.usuario, nombre: usuario.nombre,
    correo: usuario.correo, dpi: usuario.dpi ?? '', rol: usuario.rol, activo: Boolean(usuario.activo)
});

