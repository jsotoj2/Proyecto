import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('el cliente envía operaciones explícitas y reutiliza lecturas recientes', async () => {
    const codigo = await fs.readFile(new URL('../publico/js/data/datos.js', import.meta.url), 'utf8');
    const llamadas = [];
    const contexto = { window: {}, AbortSignal, structuredClone, Date, document: { getElementById: () => null }, location: {} };
    contexto.fetch = async (url, opciones) => {
        llamadas.push({ url, opciones });
        return { ok: true, json: async () => ({ version: 3, usuarios: [], becas: [{ nombre: '<prueba>' }] }) };
    };
    vm.runInNewContext(codigo, contexto);
    const cliente = contexto.window.BecasData;
    await Promise.all([cliente.cargar(), cliente.cargar()]);
    await cliente.cargar();
    assert.equal(llamadas.length, 1);
    assert.equal(cliente.obtener().becas[0].nombre, '&lt;prueba&gt;');
    await cliente.ejecutar('cupos', { becaId: 1, cupos: 7 });
    assert.equal(llamadas[1].url, '/api/plataforma/cupos');
    assert.equal(llamadas[1].opciones.method, 'PATCH');
    assert.deepEqual(JSON.parse(llamadas[1].opciones.body), { becaId: 1, cupos: 7, version: 3 });
    await assert.rejects(cliente.ejecutar('desconocida', {}));
});
