import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentosServicio } from '../servidor/aplicacion/documentosServicio.js';
import { PlataformaServicio } from '../servidor/aplicacion/plataformaServicio.js';
import { RepositorioPrueba, aspirante, administrador, formulario } from './soporte.js';

async function preparar() {
    const repositorio = new RepositorioPrueba();
    await new PlataformaServicio(repositorio).accion(aspirante, { tipo: 'formulario', version: 0, becaId: 1, formulario });
    return { repositorio, servicio: new DocumentosServicio(repositorio) };
}
const pdf = Buffer.from('%PDF-1.4\nDocumento de prueba');

test('el servicio de documentos permite subir y consultar el PDF propio, sin exponerlo a otro aspirante', async () => {
    const { servicio } = await preparar();
    await servicio.guardar(aspirante, 1, 'constancia.pdf', pdf);
    assert.equal((await servicio.obtener(aspirante, 1)).nombre, 'constancia.pdf');
    assert.equal((await servicio.listar(administrador)).length, 1);
    const otro = { ...aspirante, id: 99, usuario: 'otra' };
    assert.equal(await servicio.obtener(otro, 1), null);
    assert.deepEqual(await servicio.listar(otro), []);
    await assert.rejects(servicio.guardar(otro, 1, 'constancia.pdf', pdf), { estado: 403 });
});

test('los documentos rechazan PDF inválido, administradores, cuentas desactivadas y solicitudes revisadas', async () => {
    const { servicio, repositorio } = await preparar();
    await assert.rejects(servicio.guardar(aspirante, 1, 'falso.pdf', Buffer.from('texto')), { estado: 400 });
    await assert.rejects(servicio.guardar(administrador, 1, 'constancia.pdf', pdf), { estado: 403 });
    repositorio.usuarios[0].activo = false;
    await assert.rejects(servicio.guardar(aspirante, 1, 'constancia.pdf', pdf), { estado: 403 });
    repositorio.usuarios[0].activo = true;
    repositorio.datos.solicitudes[0].fase2.estado = 'aceptada';
    await assert.rejects(servicio.guardar(aspirante, 1, 'constancia.pdf', pdf), { estado: 403 });
    assert.equal(repositorio.archivos.size, 0);
});

test('un fallo al persistir un documento revierte la transacción', async () => {
    const { servicio, repositorio } = await preparar();
    repositorio.guardarDocumento = async () => {
        repositorio.archivos.set(1, { nombre: 'incompleto' });
        throw new Error('Fallo de almacenamiento');
    };
    await assert.rejects(servicio.guardar(aspirante, 1, 'constancia.pdf', pdf), /Fallo de almacenamiento/);
    assert.equal(repositorio.archivos.size, 0);
});
