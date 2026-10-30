import fs from 'node:fs';

export function configuracionMySQL(env = process.env) {
    const necesarios = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    for (const clave of necesarios) {
        if (!env[clave] || env[clave].startsWith('TU_')) {
            throw new Error(`Completa ${clave} en Backend/.env.`);
        }
    }
    const host = env.DB_HOST.trim();
    if (host.includes('://') || host.includes('/')) {
        throw new Error('DB_HOST debe ser solo el dominio o la IP; el puerto va en DB_PORT.');
    }
    const port = Number(env.DB_PORT || 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('DB_PORT debe ser un puerto válido.');
    }
    const sslActivo = String(env.DB_SSL ?? 'true').toLowerCase();
    if (!['true', 'false'].includes(sslActivo)) throw new Error('DB_SSL debe ser true o false.');
    const cert = env.DB_SSL_CERT?.trim();
    const key = env.DB_SSL_KEY?.trim();
    if (Boolean(cert) !== Boolean(key)) throw new Error('Completa DB_SSL_CERT y DB_SSL_KEY juntos.');
    const config = {
        host,
        port,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 10000,
        timezone: 'Z',
        multipleStatements: false
    };
    if (sslActivo === 'true') {
        config.ssl = { rejectUnauthorized: true };
        if (env.DB_SSL_CA?.trim()) config.ssl.ca = fs.readFileSync(env.DB_SSL_CA.trim());
        if (cert) { config.ssl.cert = fs.readFileSync(cert); config.ssl.key = fs.readFileSync(key); }
    }
    return config;
}
