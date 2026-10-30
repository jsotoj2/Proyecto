import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const derivar = promisify(scrypt);
const parametros = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

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
