import test from 'node:test';
import assert from 'node:assert/strict';
import { validarCuenta, validarCorreo, validarNombre } from '../servidor/negocio/cuentas.js';
import { PlataformaServicio } from '../servidor/aplicacion/plataformaServicio.js';
import { RepositorioPrueba, aspirante, formulario } from './soporte.js';

const cuenta = { usuario: 'maria.lopez', nombre: 'María López', correo: 'maria@correo.gt', dpi: '1234567890123', password: 'Segura-2026' };

test('las cuentas exigen nombres sin números y correos válidos', () => {
    assert.equal(validarNombre("María José O'Neil-Pérez"), "María José O'Neil-Pérez");
    assert.equal(validarCorreo('Maria@Correo.GT'), 'maria@correo.gt');
    for (const nombre of ['María 2', 'Ana@López', '123']) assert.throws(() => validarCuenta({ ...cuenta, nombre }), { estado: 400 });
    for (const correo of ['maria@', 'maria@correo', 'maria correo@x.com', 'maria@correo.c']) assert.throws(() => validarCuenta({ ...cuenta, correo }), { estado: 400 });
    assert.equal(validarCuenta(cuenta).correo, 'maria@correo.gt');
});

test('el formulario exige un teléfono de 8 dígitos', async () => {
    for (const telefono of ['5555 1234', '5555-1234', '555512', '555512345']) {
        const servicio = new PlataformaServicio(new RepositorioPrueba());
        await assert.rejects(servicio.accion(aspirante, { tipo: 'formulario', version: 0, becaId: 1, formulario: { ...formulario, telefono } }), { message: /8 dígitos/ });
    }
    const servicio = new PlataformaServicio(new RepositorioPrueba());
    const estado = await servicio.accion(aspirante, { tipo: 'formulario', version: 0, becaId: 1, formulario: { ...formulario, telefono: '55551234' } });
    assert.equal(estado.solicitudes[0].formulario.telefono, '55551234');
});
