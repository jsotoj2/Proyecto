import { describe, expect, test, vi, beforeEach } from 'vitest';
import { crearAlmacenEstado } from './almacenEstado.js';
import { api } from './cliente.js';

describe('almacén de estado', () => {
    let llamadas;

    beforeEach(() => {
        llamadas = [];
        vi.stubGlobal('fetch', async (url, opciones) => {
            llamadas.push({ url, opciones });
            return { ok: true, status: 200, json: async () => ({ version: 3, usuarios: [], becas: [{ nombre: '<prueba>' }] }) };
        });
    });

    test('reutiliza lecturas recientes y envía operaciones explícitas con la versión', async () => {
        const almacen = crearAlmacenEstado({ api });
        await Promise.all([almacen.cargar(), almacen.cargar()]);
        await almacen.cargar();
        expect(llamadas).toHaveLength(1);
        // React escapa el contenido al mostrarlo; el almacén conserva el texto original.
        expect(almacen.obtener().becas[0].nombre).toBe('<prueba>');

        await almacen.ejecutar('cupos', { becaId: 1, cupos: 7 });
        expect(llamadas[1].url).toBe('/api/plataforma/cupos');
        expect(llamadas[1].opciones.method).toBe('PATCH');
        expect(JSON.parse(llamadas[1].opciones.body)).toEqual({ becaId: 1, cupos: 7, version: 3 });
        await expect(almacen.ejecutar('desconocida', {})).rejects.toThrow('Operación no reconocida.');
    });

    test('recarga el estado tras un conflicto de versión', async () => {
        const apiFalsa = vi.fn(async ruta => {
            if (ruta === 'revisiones') throw Object.assign(new Error('Los datos cambiaron.'), { estado: 409 });
            return { version: apiFalsa.mock.calls.length };
        });
        const almacen = crearAlmacenEstado({ api: apiFalsa });
        await almacen.cargar();
        await expect(almacen.ejecutar('fase2', { usuario: 'ana' })).rejects.toThrow('Los datos cambiaron.');
        expect(apiFalsa.mock.calls.map(([ruta]) => ruta)).toEqual(['estado', 'revisiones', 'estado']);
        expect(almacen.obtener().version).toBe(3);
    });

    test('notifica a los suscriptores y se limpia al cerrar sesión', async () => {
        const almacen = crearAlmacenEstado({ api });
        const oyente = vi.fn();
        almacen.suscribir(oyente);
        await almacen.cargar();
        almacen.limpiar();
        expect(oyente).toHaveBeenCalledTimes(2);
        expect(almacen.obtener()).toBeNull();
    });
});
