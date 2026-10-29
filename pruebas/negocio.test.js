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

// Lleva una solicitud hasta la decisión final con el monto indicado.
async function solicitudEntrevistada(monto) {
    const repositorio = new RepositorioPrueba();
    repositorio.usuarios.push({ ...administrador, id: 4, usuario: 'admin2', nombre: 'Segunda revisión' });
    const servicio = new PlataformaServicio(repositorio);
    const ejecutar = (actor, accion) => servicio.accion(actor, { ...accion, version: repositorio.version });
    await ejecutar(aspirante, { tipo: 'formulario', becaId: 1, formulario: { ...formulario, monto } });
    await ejecutar(administrador, { tipo: 'fase2', usuario: 'ana', estado: 'aceptada', comentario: 'Completo' });
    await ejecutar(administrador, { tipo: 'horario', fecha: '2099-01-01', hora: '10:00', modalidad: 'Virtual' });
    await ejecutar(aspirante, { tipo: 'reservar', horarioId: 1 });
    await ejecutar(administrador, { tipo: 'entrevista', usuario: 'ana' });
    return { repositorio, servicio, ejecutar, segundo: repositorio.usuarios[3] };
}

test('el monto solicitado es obligatorio y se valida', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    for (const monto of [undefined, '', '0', '-5', 'abc']) {
        await assert.rejects(servicio.accion(aspirante, { tipo: 'formulario', becaId: 1, formulario: { ...formulario, monto }, version: 0 }), { estado: 400 });
    }
    await servicio.accion(aspirante, { tipo: 'formulario', becaId: 1, formulario: { ...formulario, monto: '1234.567' }, version: 0 });
    assert.equal(repositorio.datos.solicitudes[0].formulario.monto, '1234.57');
});

test('hasta 10,000 la decisión final autoriza la beca sin segunda aprobación', async () => {
    const { repositorio, ejecutar } = await solicitudEntrevistada('10000');
    await ejecutar(administrador, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Otorgada' });
    assert.equal(repositorio.datos.solicitudes[0].fase4.estado, 'aceptada');
});

test('más de 10,000 requiere la segunda aprobación de otro administrador', async () => {
    const { repositorio, servicio, ejecutar, segundo } = await solicitudEntrevistada('10000.01');
    await ejecutar(administrador, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Primera aprobación' });
    assert.equal(repositorio.datos.solicitudes[0].fase4.estado, 'pendiente_aprobacion');
    assert.equal(repositorio.datos.solicitudes[0].fase4.aprobadoPor, 'admin');
    // Mientras espera, la solicitud ocupa su cupo y no admite otra decisión final.
    await assert.rejects(ejecutar(superior, { tipo: 'cupos', becaId: 1, cupos: 0 }), { estado: 400 });
    await assert.rejects(ejecutar(segundo, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Otra vez' }), { estado: 409 });
    await assert.rejects(ejecutar(administrador, { tipo: 'segunda-aprobacion', usuario: 'ana', estado: 'aceptada', comentario: 'Yo mismo' }), { estado: 403 });
    await assert.rejects(ejecutar(aspirante, { tipo: 'segunda-aprobacion', usuario: 'ana', estado: 'aceptada', comentario: 'Yo' }), { estado: 403 });
    assert.equal(repositorio.datos.solicitudes[0].fase4.estado, 'pendiente_aprobacion');
    await ejecutar(segundo, { tipo: 'segunda-aprobacion', usuario: 'ana', estado: 'aceptada', comentario: 'Autorizada' });
    assert.equal(repositorio.datos.solicitudes[0].fase4.estado, 'aceptada');
    await assert.rejects(ejecutar(segundo, { tipo: 'segunda-aprobacion', usuario: 'ana', estado: 'rechazada', comentario: 'Tarde' }), { estado: 409 });
    const vista = await servicio.estado(aspirante);
    assert.equal(vista.solicitudes[0].fase4.aprobadoPor, undefined);
    assert.equal(vista.solicitudes[0].fase4.segundoAprobador, undefined);
    assert.equal(vista.solicitudes[0].fase2.revisadoPor, undefined);
});

test('la segunda aprobación también puede rechazar la solicitud', async () => {
    const { repositorio, ejecutar, segundo } = await solicitudEntrevistada('25000');
    await ejecutar(administrador, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Primera aprobación' });
    await ejecutar(segundo, { tipo: 'segunda-aprobacion', usuario: 'ana', estado: 'rechazada', comentario: 'Monto excesivo' });
    assert.deepEqual(repositorio.datos.solicitudes[0].fase4, { estado: 'rechazada', comentario: 'Monto excesivo', aprobadoPor: 'admin', segundoAprobador: 'admin2' });
});

test('cada cambio de estado notifica al aspirante y se registra en la bitácora', async () => {
    const { repositorio, servicio, ejecutar, segundo } = await solicitudEntrevistada('15000');
    await ejecutar(administrador, { tipo: 'fase4', usuario: 'ana', estado: 'aceptada', comentario: 'Primera aprobación' });
    await ejecutar(segundo, { tipo: 'segunda-aprobacion', usuario: 'ana', estado: 'aceptada', comentario: 'Autorizada' });
    // La bitácora también registra operaciones generales, como publicar el horario; aquí solo interesan las de la solicitud.
    const deSolicitud = repositorio.bitacora.filter(e => e.estadoNuevo);
    const estados = deSolicitud.map(e => e.estadoNuevo).reverse();
    assert.deepEqual(estados, ['formulario-enviado', 'revision-aceptada', 'entrevista-programada', 'entrevista-realizada', 'resultado-pendiente_aprobacion', 'resultado-aceptada']);
    const ultimo = repositorio.bitacora[0];
    assert.deepEqual(
        { actor: ultimo.actorUsuario, rol: ultimo.actorRol, operacion: ultimo.operacion, anterior: ultimo.estadoAnterior, resultado: ultimo.resultado, detalle: ultimo.detalle },
        { actor: 'admin2', rol: 'admin', operacion: 'segunda-aprobacion', anterior: 'resultado-pendiente_aprobacion', resultado: 'exito', detalle: 'Autorizada' }
    );
    assert(!Number.isNaN(Date.parse(ultimo.fecha)));
    assert.equal(repositorio.avisos.length, 6);
    assert(repositorio.avisos.every(n => n.usuario === 'ana' && !n.leida));
    const vista = await servicio.estado(aspirante);
    assert.equal(vista.notificaciones.length, 6);
    assert.equal(vista.auditoria, undefined);
    assert.equal((await servicio.estado(administrador)).auditoria.length, repositorio.bitacora.length);
    assert.equal(deSolicitud.length, 6);
    const leidas = await servicio.leerNotificaciones(aspirante);
    assert(leidas.notificaciones.every(n => n.leida));
    await assert.rejects(servicio.leerNotificaciones(administrador), { estado: 403 });
});

test('una modificación sin cambio de estado se audita sin notificar', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    await servicio.accion(aspirante, { tipo: 'formulario', becaId: 1, formulario, version: 0 });
    await servicio.accion(aspirante, { tipo: 'formulario', becaId: 1, formulario: { ...formulario, monto: '8000' }, version: 1 });
    assert.equal(repositorio.bitacora.length, 2);
    assert.match(repositorio.bitacora[0].detalle, /8,000\.00/);
    assert.equal(repositorio.avisos.length, 1);
});

test('los intentos rechazados quedan en la bitácora sin alterar datos ni notificar', async () => {
    const repositorio = new RepositorioPrueba();
    const servicio = new PlataformaServicio(repositorio);
    await servicio.accion(aspirante, { tipo: 'formulario', becaId: 1, formulario, version: 0 });
    await assert.rejects(servicio.accion(aspirante, { tipo: 'fase2', usuario: 'ana', estado: 'aceptada', comentario: 'Me apruebo', version: 1 }), { estado: 403 });
    await assert.rejects(servicio.accion(administrador, { tipo: 'fase2', usuario: 'ana', estado: 'aceptada', comentario: 'Versión vieja', version: 0 }), { estado: 409 });
    const [conflicto, permiso] = repositorio.bitacora;
    assert.deepEqual([permiso.actorUsuario, permiso.operacion, permiso.resultado, permiso.usuarioSolicitud], ['ana', 'fase2', 'rechazado', 'ana']);
    assert.match(permiso.detalle, /permiso/);
    assert.equal(conflicto.actorUsuario, 'admin');
    assert.equal(repositorio.datos.solicitudes[0].fase2.estado, 'pendiente');
    assert.equal(repositorio.avisos.length, 1);
    // Las operaciones ajenas a una solicitud no se incluyen en esta bitácora.
    await assert.rejects(servicio.accion(aspirante, { tipo: 'cupos', becaId: 1, cupos: 5, version: 1 }), { estado: 403 });
    assert.equal(repositorio.bitacora.length, 3);
});
