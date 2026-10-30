import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enteroConfiguracion } from './mysql.js';
import { crearTransporteArchivo, crearTransporteSmtp } from '../correo/transportes.js';

const raiz = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Elige el transporte según CORREO_TRANSPORTE:
 * - smtp: envía con el servidor SMTP configurado (predeterminado si existe SMTP_HOST).
 * - archivo: guarda cada correo como HTML en CORREO_CARPETA (predeterminado en desarrollo).
 * - desactivado: no envía; los correos esperan en la bandeja hasta que se configure un transporte.
 */
export function transporteCorreo(entorno = process.env) {
    const produccion = entorno.NODE_ENV === 'production';
    const modo = entorno.CORREO_TRANSPORTE || (entorno.SMTP_HOST ? 'smtp' : produccion ? 'desactivado' : 'archivo');
    if (!['smtp', 'archivo', 'desactivado'].includes(modo)) throw new Error('CORREO_TRANSPORTE debe ser smtp, archivo o desactivado.');
    if (modo === 'desactivado') return null;
    if (modo === 'archivo') return crearTransporteArchivo(path.resolve(raiz, entorno.CORREO_CARPETA || 'correos-locales'));

    for (const nombre of ['SMTP_HOST', 'CORREO_REMITENTE']) {
        if (!entorno[nombre]) throw new Error(`Completa ${nombre} en el archivo .env para enviar correos.`);
    }
    const seguro = (entorno.SMTP_SECURE ?? 'false') === 'true';
    return crearTransporteSmtp({
        host: entorno.SMTP_HOST,
        puerto: enteroConfiguracion(entorno.SMTP_PORT, 'SMTP_PORT', seguro ? 465 : 587, 1, 65535),
        seguro,
        usuario: entorno.SMTP_USER,
        contrasena: entorno.SMTP_PASSWORD,
        remitente: entorno.CORREO_REMITENTE
    });
}
