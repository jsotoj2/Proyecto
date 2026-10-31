import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../../', import.meta.url));
export function enteroConfiguracion(valor, nombre, defecto, minimo, maximo) {
    const numero = Number(valor ?? defecto);
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
        throw new Error(`${nombre} debe ser un entero entre ${minimo} y ${maximo}.`);
    }
    return numero;
}

export function configuracionMySQL(entorno = process.env) {
    for (const nombre of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
        if (!entorno[nombre] || entorno[nombre].startsWith('TU_')) {
            throw new Error(`Completa ${nombre} en el archivo .env.`);
        }
    }
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(entorno.DB_NAME)) throw new Error('DB_NAME no es válido.');
    if (/[\/\s]/.test(entorno.DB_HOST) || entorno.DB_HOST.includes('://')) throw new Error('DB_HOST debe contener solo el dominio o la IP.');
    const tls = entorno.DB_SSL ?? 'true';
    if (!['true', 'false'].includes(tls)) throw new Error('DB_SSL debe ser true o false.');
    if (entorno.NODE_ENV === 'production' && tls !== 'true') throw new Error('La conexión de producción requiere TLS.');
    const configuracion = {
        host: entorno.DB_HOST, user: entorno.DB_USER, password: entorno.DB_PASSWORD,
        database: entorno.DB_NAME,
        port: enteroConfiguracion(entorno.DB_PORT, 'DB_PORT', 3306, 1, 65535),
        connectionLimit: enteroConfiguracion(entorno.DB_POOL_MAX, 'DB_POOL_MAX', 5, 1, 50),
        queueLimit: enteroConfiguracion(entorno.DB_QUEUE_MAX, 'DB_QUEUE_MAX', 50, 1, 1000),
        connectTimeout: enteroConfiguracion(entorno.DB_CONNECT_TIMEOUT, 'DB_CONNECT_TIMEOUT', 10000, 1000, 60000),
        waitForConnections: true, enableKeepAlive: true, timezone: 'Z', dateStrings: true,
        charset: 'utf8mb4', multipleStatements: false, supportBigNumbers: true, bigNumberStrings: true
    };
    const certificado = entorno.DB_SSL_CERT?.trim();
    const llave = entorno.DB_SSL_KEY?.trim();
    if (Boolean(certificado) !== Boolean(llave)) throw new Error('DB_SSL_CERT y DB_SSL_KEY deben configurarse juntos.');
    if (tls === 'true') {
        configuracion.ssl = { rejectUnauthorized: true };
        for (const [variable, propiedad] of [['DB_SSL_CA', 'ca'], ['DB_SSL_CERT', 'cert'], ['DB_SSL_KEY', 'key']]) {
            if (entorno[variable]?.trim()) configuracion.ssl[propiedad] = fs.readFileSync(path.resolve(raiz, entorno[variable].trim()));
        }
    }
    return configuracion;
}
