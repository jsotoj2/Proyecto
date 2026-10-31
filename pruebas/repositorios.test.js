import test from 'node:test';
import assert from 'node:assert/strict';
import { UsuariosRepositorio } from '../servidor/datos/usuariosRepositorio.js';
import { configuracionMySQL } from '../servidor/infraestructura/configuracion/mysql.js';

test('la transacción confirma y libera la conexión', async () => {
    const llamadas = [];
    const conexion = { beginTransaction: async () => llamadas.push('inicio'), commit: async () => llamadas.push('confirmar'), rollback: async () => llamadas.push('revertir'), release: () => llamadas.push('liberar') };
    const repositorio = new UsuariosRepositorio({ getConnection: async () => conexion });
    assert.equal(await repositorio.transaccion(async () => 42), 42);
    assert.deepEqual(llamadas, ['inicio', 'confirmar', 'liberar']);
});

test('los errores revierten y siempre liberan la conexión', async () => {
    const llamadas = [];
    const conexion = { beginTransaction: async () => {}, rollback: async () => llamadas.push('revertir'), release: () => llamadas.push('liberar') };
    const repositorio = new UsuariosRepositorio({ getConnection: async () => conexion });
    await assert.rejects(repositorio.transaccion(async () => { throw new Error('Fallo controlado'); }), /Fallo controlado/);
    assert.deepEqual(llamadas, ['revertir', 'liberar']);
});

test('las consultas de usuario parametrizan valores potencialmente maliciosos', async () => {
    let recibido;
    const repositorio = new UsuariosRepositorio({ execute: async (...argumentos) => { recibido = argumentos; return [[]]; } });
    const nombre = "x' OR 1=1 --";
    await repositorio.buscarUsuario(nombre);
    assert(!recibido[0].includes(nombre));
    assert.deepEqual(recibido[1], [nombre]);
});

test('configuración validada, cola limitada y TLS obligatorio en producción', () => {
    const entorno = { DB_HOST: '127.0.0.1', DB_USER: 'becas', DB_PASSWORD: 'solo-prueba', DB_NAME: 'becas_prueba', DB_SSL: 'false' };
    const configuracion = configuracionMySQL(entorno);
    assert.equal(configuracion.multipleStatements, false);
    assert.equal(configuracion.queueLimit, 50);
    assert.throws(() => configuracionMySQL({ ...entorno, DB_PORT: '0' }));
    assert.throws(() => configuracionMySQL({ ...entorno, DB_NAME: 'base; DROP DATABASE base' }));
    assert.throws(() => configuracionMySQL({ ...entorno, NODE_ENV: 'production' }));
});
