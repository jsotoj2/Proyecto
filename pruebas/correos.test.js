import test from 'node:test';
import assert from 'node:assert/strict';
import { PlataformaServicio } from '../servidor/servicios/plataformaServicio.js';
import { correoDeEtapa } from '../servidor/correo/plantillas.js';
import { crearDespachador } from '../servidor/correo/despachador.js';
import { transporteCorreo } from '../servidor/configuracion/correo.js';
import { RepositorioPrueba, administrador, aspirante, formulario } from './soporte.js';

test('cada cambio de etapa deja un correo para el aspirante, con enlace al panel', async () => {
    const repositorio = new RepositorioPrueba();
    let avisos = 0;
    const servicio = new PlataformaServicio(repositorio, { urlPanel: 'https://becas.test/', alEncolarCorreos: () => { avisos += 1; } });
    await servicio.accion(aspirante, { tipo: 'formulario', version: 0, becaId: 1, formulario });
    // Corregir el formulario sin cambiar de etapa no genera otro correo.
    await servicio.accion(aspirante, { tipo: 'formulario', version: 1, becaId: 1, formulario: { ...formulario, edad: '21' } });
    await servicio.accion(administrador, { tipo: 'fase2', version: 2, usuario: 'ana', estado: 'rechazada', comentario: 'Falta <b>constancia</b>' });

    assert.equal(repositorio.correos.length, 2);
    assert.equal(avisos, 2);
    const [recibido, rechazo] = repositorio.correos;
    assert.equal(recibido.destinatario, aspirante.correo);
    assert.match(recibido.asunto, /Recibimos tu solicitud/);
    assert.match(recibido.texto, /BN-000001/);
    assert.match(recibido.html, /href="https:\/\/becas\.test\/panel\/solicitud"/);
    assert.match(rechazo.asunto, /no fue aprobado/);
    // El comentario del administrador se escapa en el HTML.
    assert.match(rechazo.html, /Falta &lt;b&gt;constancia&lt;\/b&gt;/);
    assert.match(rechazo.texto, /Comentario: Falta <b>constancia<\/b>/);
});

test('si la operación falla no queda ningún correo en la bandeja', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    await assert.rejects(servicio.accion(aspirante, { tipo: 'formulario', version: 0, becaId: 1, formulario: { ...formulario, telefono: '123' } }));
    assert.equal(repositorio.correos.length, 0);
});

test('la plantilla de entrevista incluye fecha, hora y modalidad', () => {
    const solicitud = { id: 3, fase2: {}, fase4: {}, entrevista: { fecha: '2026-11-02', hora: '09:30', modalidad: 'Virtual' } };
    const correo = correoDeEtapa('entrevista-programada', { nombre: 'Ana', beca: 'Ingeniería', solicitud, enlace: '' });
    assert.match(correo.texto, /Fecha: lunes, 2 de noviembre de 2026/);
    assert.match(correo.texto, /Hora: 09:30/);
    assert.match(correo.texto, /Modalidad: Virtual/);
    assert.doesNotMatch(correo.html, /Ver mi solicitud/);
});

test('el despachador envía, reintenta con espera y marca como fallido al agotar intentos', async () => {
    const repositorio = new RepositorioPrueba();
    await repositorio.encolarCorreos([
        { destinatario: 'bien@example.test', asunto: 'A', texto: 'a', html: '<p>a</p>' },
        { destinatario: 'mal@example.test', asunto: 'B', texto: 'b', html: '<p>b</p>' }
    ]);
    const enviados = [];
    const transporte = { enviar: async correo => { if (correo.destinatario.startsWith('mal')) throw new Error('SMTP caído'); enviados.push(correo.destinatario); } };
    const despachador = crearDespachador({ repositorio, transporte, maxIntentos: 2, registrar: {} });

    await despachador.procesar();
    assert.deepEqual(enviados, ['bien@example.test']);
    assert.equal(repositorio.correos[0].estado, 'enviado');
    assert.equal(repositorio.correos[1].estado, 'pendiente');
    assert.ok(repositorio.correos[1].disponible > Date.now(), 'el reintento espera');

    repositorio.correos[1].disponible = 0;
    await despachador.procesar();
    assert.equal(repositorio.correos[1].estado, 'fallido');
    assert.equal(repositorio.correos[1].ultimoError, 'SMTP caído');
});

test('configuración del transporte de correo', () => {
    assert.equal(transporteCorreo({ NODE_ENV: 'production' }), null);
    assert.equal(transporteCorreo({}).nombre, 'archivo');
    assert.equal(transporteCorreo({ SMTP_HOST: 'smtp.example.test', CORREO_REMITENTE: 'Becas <no-responder@example.test>' }).nombre, 'smtp');
    assert.throws(() => transporteCorreo({ SMTP_HOST: 'smtp.example.test' }), /CORREO_REMITENTE/);
    assert.throws(() => transporteCorreo({ CORREO_TRANSPORTE: 'paloma' }), /smtp, archivo o desactivado/);
});
