/*
 * Reglas de validación de formularios. Cada regla recibe el valor (y todos los valores del formulario)
 * y devuelve un mensaje de error o `null`. El servidor vuelve a validar cada dato.
 */
const texto = valor => String(valor ?? '').trim();

export const PATRON_NOMBRE = /^\p{L}+(?:[\s'’.-]+\p{L}+)*\.?$/u;
export const PATRON_CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
export const PATRON_USUARIO = /^[a-z0-9_.-]+$/i;

export const requerido = (mensaje = 'Este campo es obligatorio.') => valor => (texto(valor) ? null : mensaje);

export const longitud = (minimo, maximo) => valor => {
    const largo = texto(valor).length;
    if (largo && largo < minimo) return `Escribe al menos ${minimo} caracteres.`;
    if (largo > maximo) return `Máximo ${maximo} caracteres.`;
    return null;
};

export const nombre = valor => (!texto(valor) || PATRON_NOMBRE.test(texto(valor)) ? null : 'Usa solo letras y espacios, sin números ni símbolos.');

export const correo = valor => (!texto(valor) || PATRON_CORREO.test(texto(valor)) ? null : 'Ingresa un correo válido, por ejemplo nombre@dominio.com.');

export const telefono = valor => (!texto(valor) || /^\d{8}$/.test(texto(valor)) ? null : 'El teléfono debe tener exactamente 8 dígitos.');

export const dpi = valor => (!texto(valor) || /^\d{13}$/.test(texto(valor)) ? null : 'El DPI debe tener exactamente 13 dígitos.');

export const usuario = valor => {
    if (!texto(valor)) return null;
    if (texto(valor).length < 3) return 'El usuario debe tener al menos 3 caracteres.';
    return PATRON_USUARIO.test(texto(valor)) ? null : 'Usa letras, números, punto, guion o guion bajo, sin espacios.';
};

export const contrasena = valor => (!valor || valor.length >= 8 ? null : 'La contraseña debe tener al menos 8 caracteres.');

export const entero = (minimo, maximo) => valor => {
    if (!texto(valor)) return null;
    if (!/^\d+$/.test(texto(valor))) return 'Ingresa un número entero.';
    const numero = Number(valor);
    return numero < minimo || numero > maximo ? `Ingresa un valor entre ${minimo} y ${maximo}.` : null;
};

export const decimal = (minimo, maximo, decimales = 2) => valor => {
    if (!texto(valor)) return null;
    if (!new RegExp(`^\\d+(\\.\\d{1,${decimales}})?$`).test(texto(valor))) return `Ingresa un número válido (hasta ${decimales} decimales).`;
    const numero = Number(valor);
    return numero < minimo || numero > maximo ? `Ingresa un valor entre ${minimo.toLocaleString('es-GT')} y ${maximo.toLocaleString('es-GT')}.` : null;
};

/** Primer mensaje de error de una lista de reglas. */
export function primerError(reglas = [], valor, valores = {}) {
    for (const regla of reglas) {
        const mensaje = regla(valor, valores);
        if (mensaje) return mensaje;
    }
    return null;
}

/* Limpiadores: impiden escribir caracteres que el campo nunca acepta. */
export const soloDigitos = maximo => valor => valor.replace(/\D/g, '').slice(0, maximo);

export const soloDecimal = (decimales = 2) => valor => {
    const limpio = valor.replace(',', '.').replace(/[^\d.]/g, '');
    const [enteros, ...resto] = limpio.split('.');
    return resto.length ? `${enteros}.${resto.join('').slice(0, decimales)}` : enteros;
};

export const soloLetras = valor => valor.replace(/[^\p{L}\s'’.-]/gu, '').replace(/\s{2,}/g, ' ');

export const sinEspacios = valor => valor.replace(/\s/g, '');

/** Campos de cuenta compartidos por el registro, el perfil y la creación de usuarios. */
export const CAMPOS_CUENTA = {
    nombre: { reglas: [requerido('Escribe el nombre completo.'), longitud(2, 160), nombre], limpiar: soloLetras },
    correo: { reglas: [requerido('Escribe el correo electrónico.'), longitud(0, 254), correo], limpiar: sinEspacios },
    dpi: { reglas: [requerido('Escribe el DPI.'), dpi], limpiar: soloDigitos(13) },
    usuario: { reglas: [requerido('Elige un nombre de usuario.'), longitud(0, 40), usuario], limpiar: sinEspacios },
    password: { reglas: [requerido('Escribe una contraseña.'), contrasena] }
};
