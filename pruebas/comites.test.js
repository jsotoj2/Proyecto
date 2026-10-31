import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { PlataformaServicio } from '../servidor/aplicacion/plataformaServicio.js';
import { crearRutas } from '../servidor/presentacion/rutas.js';
import { ComiteRepositorio } from '../servidor/datos/comiteRepositorio.js';
import { RepositorioPrueba, superior, administrador } from './soporte.js';

test('asignar comité exige superadmin, valida la beca y el tipo, y participa en la transacción', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    const accion = { tipo: 'asignar-comite', becaId: 1, tipoComite: 'academico', version: 0 };
    await assert.rejects(servicio.accion(administrador, accion), { estado: 403 });
    await assert.rejects(servicio.accion(superior, { ...accion, becaId: 99 }), { estado: 404 });
    await assert.rejects(servicio.accion(superior, { ...accion, tipoComite: 'inexistente' }), { estado: 400 });
    await servicio.accion(superior, accion);
    await servicio.accion(superior, { ...accion, version: 1 });
    assert.deepEqual(repositorio.asignacionesComite, [{ becaId: 1, tipoComite: 'academico' }]);
    assert.equal(repositorio.bitacora[0].operacion, 'asignar-comite');
    repositorio.guardarEstado = async () => { throw new Error('Fallo al confirmar estado'); };
    await assert.rejects(servicio.accion(superior, { ...accion, tipoComite: 'social', version: 2 }), /Fallo al confirmar/);
    assert.equal(repositorio.asignacionesComite.length, 1);
    assert.equal(repositorio.version, 2);
});

test('la ruta de comités interpreta el id de la URL y prevalece sobre datos manipulados', async () => {
    const repositorio = new RepositorioPrueba();
    const rutas = crearRutas({ autenticacion: { sesion: async () => superior }, plataforma: new PlataformaServicio(repositorio), origen: 'http://localhost' });
    const peticion = new PassThrough();
    peticion.method = 'POST';
    peticion.headers = { 'content-type': 'application/json' };
    const respuesta = { writeHead(estado) { this.estado = estado; }, end(cuerpo) { this.datos = JSON.parse(cuerpo); } };
    const atendiendo = rutas(peticion, respuesta, new URL('http://localhost/api/plataforma/becas/1/comite'));
    peticion.end(JSON.stringify({ becaId: 99, tipo: 'cupos', tipoComite: 'social', version: 0 }));
    assert.equal(await atendiendo, true);
    assert.equal(respuesta.estado, 200);
    assert.deepEqual(repositorio.asignacionesComite, [{ becaId: 1, tipoComite: 'social' }]);
});

test('el repositorio de comités parametriza la asignación y evita insertar una relación existente', async () => {
    let existe = false;
    const inserciones = [];
    const repositorio = new ComiteRepositorio({ execute: async (sql, valores) => {
        if (sql.startsWith('SELECT id FROM comites')) return [[{ id: 3 }]];
        if (sql.startsWith('SELECT id FROM beca_comite')) return [existe ? [{ id: 1 }] : []];
        inserciones.push(valores); existe = true; return [{}];
    } });
    await repositorio.asignar(7, 'social');
    await repositorio.asignar(7, 'social');
    assert.deepEqual(inserciones, [[7, 3]]);
});
