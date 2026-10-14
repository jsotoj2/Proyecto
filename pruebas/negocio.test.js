import test from 'node:test';
import assert from 'node:assert/strict';
import { AutenticacionServicio, hashPassword, verificarPassword, hashToken, validarCuenta } from '../servidor/servicios/autenticacionServicio.js';
import { PlataformaServicio } from '../servidor/servicios/plataformaServicio.js';
import { fechaHorario, numero } from '../servidor/servicios/validaciones.js';
import { RepositorioPrueba, aspirante, administrador, superior, formulario } from './soporte.js';

test('crear becas exige superadmin y las publica para los aspirantes', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    const accion = { tipo: 'crear-beca', nombre: 'Beca de Medicina', descripcion: 'Apoyo para estudios de medicina.', requisitos: ['Promedio mínimo de 80'], cupos: 12, version: 0 };
    for (const actor of [aspirante, administrador]) await assert.rejects(servicio.accion(actor, accion), { estado: 403 });
    await servicio.accion(superior, accion);
    const vista = await servicio.estado(aspirante);
    assert.equal(vista.becas.length, 2);
    assert.equal(vista.becas[1].nombre, accion.nombre);
    assert.equal(vista.becas[1].cupos, 12);
    assert.equal(vista.becas[1].id, 2);
    await assert.rejects(servicio.accion(superior, { ...accion, nombre: 'BECA de MEDICINA', version: 1 }), { estado: 409 });
    assert.equal(repositorio.datos.becas.length, 2);
});

test('crear becas valida requisitos, cupos y versión antes de guardar', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    const accion = { tipo: 'crear-beca', nombre: 'Beca nueva', descripcion: 'Descripción del nuevo programa.', requisitos: ['Requisito válido'], cupos: 5, version: 0 };
    for (const campos of [{ nombre: '' }, { descripcion: 'Breve' }, { requisitos: [] }, { requisitos: [' '] }, { requisitos: ['x'.repeat(501)] }, { requisitos: Array(31).fill('Requisito') }, { cupos: -1 }, { cupos: 1.5 }]) {
        await assert.rejects(servicio.accion(superior, { ...accion, ...campos }), { estado: 400 });
    }
    await assert.rejects(servicio.accion(superior, { ...accion, version: 99 }), { estado: 409 });
    assert.equal(repositorio.datos.becas.length, 1);
    assert.equal(repositorio.version, 0);
});

test('el registro público no permite crear administradores', async () => {
    const repositorio = new RepositorioPrueba();
    const usuario = await new AutenticacionServicio(repositorio).registrar({ ...aspirante, usuario: 'otro', rol: 'superadmin', password: 'Prueba-2026-segura' });
    assert.equal(usuario.rol, 'aspirante');
    assert.equal(usuario.password_hash, undefined);
    assert.notEqual(repositorio.usuarios.at(-1).password_hash, 'Prueba-2026-segura');
});

test('hash con sal, contraseña incorrecta y hash malformado', async () => {
    const hash = await hashPassword('Prueba-2026-segura');
    assert.equal(await verificarPassword('Prueba-2026-segura', hash), true);
    assert.equal(await verificarPassword('incorrecta', hash), false);
    assert.equal(await verificarPassword('Prueba-2026-segura', 'dañado'), false);
    assert.notEqual(await hashPassword('Prueba-2026-segura'), hash);
});

test('la sesión almacena el hash del token y se revoca al salir', async () => {
    const repositorio = new RepositorioPrueba();
    repositorio.usuarios[0].password_hash = await hashPassword('Prueba-2026-segura');
    const autenticacion = new AutenticacionServicio(repositorio);
    const sesion = await autenticacion.iniciar({ usuario: 'ana', password: 'Prueba-2026-segura' });
    assert(repositorio.sesiones.has(hashToken(sesion.token)));
    assert(!repositorio.sesiones.has(sesion.token));
    assert.equal((await autenticacion.sesion(sesion.token)).usuario, 'ana');
    await autenticacion.salir(sesion.token);
    assert.equal(await autenticacion.sesion(sesion.token), null);
});

test('DPI, fechas imposibles, horarios y números vacíos se rechazan', () => {
    assert.throws(() => validarCuenta({ ...aspirante, dpi: '123', password: '12345678' }));
    assert.throws(() => fechaHorario('2027-02-30', '10:00'));
    assert.throws(() => fechaHorario('2027-02-28', '25:00'));
    assert.equal(fechaHorario('2027-02-28', '10:00').toISOString(), '2027-02-28T16:00:00.000Z');
    for (const valor of ['', null, false, 'abc', -1]) assert.throws(() => numero(valor, 'Cupos', 0, 100, true));
});

test('permisos, versiones y cambios fallidos no alteran los datos', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    await assert.rejects(servicio.accion(aspirante, { tipo: 'cupos', becaId: 1, cupos: 99, version: 0 }), { estado: 403 });
    await assert.rejects(servicio.accion(superior, { tipo: 'cupos', becaId: 1, cupos: 99, version: 2 }), { estado: 409 });
    assert.equal(repositorio.datos.becas[0].cupos, 1);
    assert.equal(repositorio.version, 0);
});

test('flujo completo: solicitud, revisión, reserva, entrevista y decisión', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    const ejecutar = (actor, accion) => servicio.accion(actor, { ...accion, version: repositorio.version });
    await ejecutar(aspirante, { tipo: 'formulario', becaId: 1, formulario });
    await assert.rejects(ejecutar(administrador, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Aprobada' }), { estado: 409 });
    await ejecutar(administrador, { tipo: 'fase2', usuario: 'ana', estado: 'aceptada', comentario: 'Documentación completa' });
    await assert.rejects(ejecutar(aspirante, { tipo: 'formulario', becaId: 1, formulario }), { estado: 409 });
    await ejecutar(administrador, { tipo: 'horario', fecha: '2099-01-01', hora: '10:00', modalidad: 'Virtual' });
    await ejecutar(aspirante, { tipo: 'reservar', horarioId: 1 });
    await assert.rejects(ejecutar(aspirante, { tipo: 'reservar', horarioId: 1 }), { estado: 409 });
    await ejecutar(administrador, { tipo: 'entrevista', usuario: 'ana' });
    await ejecutar(administrador, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Beca otorgada' });
    await assert.rejects(ejecutar(superior, { tipo: 'cupos', becaId: 1, cupos: 0 }));
    assert.equal(repositorio.datos.solicitudes[0].fase4.estado, 'aceptada');
    const vista = await servicio.estado(aspirante);
    assert.deepEqual(vista.usuarios.map(u => u.usuario), ['ana']);
    assert.deepEqual(vista.actividad, []);
});

test('un cambio de rol o desactivación se comprueba nuevamente en la transacción', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    repositorio.usuarios[2].rol = 'aspirante';
    await assert.rejects(servicio.accion(superior, { tipo: 'cupos', becaId: 1, cupos: 2, version: 0 }), { estado: 403 });
    repositorio.usuarios[0].activo = false;
    await assert.rejects(servicio.accion(aspirante, { tipo: 'descarga', becaId: 1, version: 0 }), { estado: 401 });
});
