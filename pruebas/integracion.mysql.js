import test from 'node:test';
import assert from 'node:assert/strict';
import { crearConexion } from '../servidor/configuracion/conexion.js';
import { migrar } from '../scripts/migrar.js';
import { PlataformaRepositorio } from '../servidor/repositorios/plataformaRepositorio.js';
import { PlataformaServicio } from '../servidor/servicios/plataformaServicio.js';
import { AutenticacionServicio, hashPassword } from '../servidor/servicios/autenticacionServicio.js';
import { formulario } from './soporte.js';

test('MySQL real: migraciones repetibles, autenticación, persistencia y conflicto concurrente', async () => {
    assert.equal(process.env.PERMITIR_PRUEBAS_DB, 'si', 'Configura una base exclusiva de pruebas.');
    assert.match(process.env.DB_NAME, /_pruebas$/, 'La base debe terminar en _pruebas.');
    const conexion = crearConexion();
    try {
        const [tablas] = await conexion.query('SHOW TABLES');
        assert.equal(tablas.length, 0, 'Usa una base vacía para evitar afectar datos existentes.');
        await migrar(conexion);
        await migrar(conexion);
        const repositorio = new PlataformaRepositorio(conexion);
        const admin = await repositorio.crearUsuario({ usuario: 'superprueba', nombre: 'Prueba', correo: 'prueba@example.test', dpi: null, rol: 'superadmin', activo: true, password_hash: await hashPassword('Solo-pruebas-2026') });
        const autenticacion = new AutenticacionServicio(repositorio);
        const actor = await autenticacion.registrar({ usuario: 'aspiranteprueba', nombre: 'Aspirante', correo: 'aspirante@example.test', dpi: '1234567890123', password: 'Solo-pruebas-2026' });
        const sesion = await autenticacion.iniciar({ usuario: actor.usuario, password: 'Solo-pruebas-2026' });
        assert.equal((await autenticacion.sesion(sesion.token)).usuario, actor.usuario);
        const servicio = new PlataformaServicio(repositorio);
        const estado = await servicio.estado(actor);
        const enviados = await servicio.accion(actor, { tipo: 'formulario', becaId: 1, formulario, version: estado.version });
        assert.equal(enviados.solicitudes.length, 1);
        const version = enviados.version;
        const resultados = await Promise.allSettled([
            servicio.accion(admin, { tipo: 'cupos', becaId: 1, cupos: 21, version }),
            servicio.accion(admin, { tipo: 'cupos', becaId: 1, cupos: 22, version })
        ]);
        assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1);
        assert.equal(resultados.find(r => r.status === 'rejected').reason.estado, 409);
        const [filas] = await conexion.execute('SELECT usuario FROM postulaciones');
        assert.equal(filas[0].usuario, actor.usuario);
        await autenticacion.salir(sesion.token);
        assert.equal(await autenticacion.sesion(sesion.token), null);
    } finally { await conexion.end(); }
});
