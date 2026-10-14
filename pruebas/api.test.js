import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { crearRutas } from '../servidor/api/rutas.js';
import { crearAplicacion } from '../servidor/api/aplicacion.js';
import { PlataformaServicio } from '../servidor/servicios/plataformaServicio.js';
import { RepositorioPrueba, aspirante, formulario } from './soporte.js';

test('manejador HTTP: acceso, origen, validación, rutas explícitas y archivos privados', async () => {
    const repositorio = new RepositorioPrueba();
    const autenticacion = { sesion: async token => token === 'valida' ? aspirante : null, registrar: async datos => datos };
    const rutas = crearRutas({ autenticacion, plataforma: new PlataformaServicio(repositorio), repositorio, origen: 'http://localhost:3000' });
    const aplicacion = crearAplicacion({ rutas, comprobarConexion: async () => {}, registrarError: () => {} });
    // Se inyectan streams HTTP para probar los manejadores sin abrir puertos.
    const peticion = async (ruta, opciones = {}) => {
        const entrada = new PassThrough();
        entrada.url = ruta;
        entrada.method = opciones.method ?? 'GET';
        entrada.headers = Object.fromEntries(Object.entries(opciones.headers ?? {}).map(([clave, valor]) => [clave.toLowerCase(), valor]));
        entrada.socket = { remoteAddress: '127.0.0.1' };
        const salida = { status: 200, cabeceras: {}, setHeader(clave, valor) { this.cabeceras[clave] = valor; }, writeHead(estado, cabeceras) { this.status = estado; Object.assign(this.cabeceras, cabeceras); }, end(contenido) { this.contenido = contenido; this.writableEnded = true; }, json() { return JSON.parse(this.contenido); } };
        const promesa = aplicacion(entrada, salida);
        entrada.end(opciones.body ?? '');
        await promesa;
        return salida;
    };
    assert.equal((await peticion('/api/plataforma/estado')).status, 401);
    const cabeceras = { 'Content-Type': 'application/json', Cookie: 'becas_sesion=valida' };
    assert.equal((await peticion('/api/plataforma/solicitudes', { method: 'POST', headers: { ...cabeceras, Origin: 'https://externo.test' }, body: '{}' })).status, 403);
    assert.equal((await peticion('/api/plataforma/solicitudes', { method: 'POST', headers: cabeceras, body: '{' })).status, 400);
    assert.equal((await peticion('/api/plataforma/solicitudes', { method: 'POST', headers: { Cookie: 'becas_sesion=valida' }, body: '{}' })).status, 415);
    const respuesta = await peticion('/api/plataforma/solicitudes', { method: 'POST', headers: cabeceras, body: JSON.stringify({ becaId: 1, formulario, version: 0, tipo: 'cupos' }) });
    assert.equal(respuesta.status, 200);
    assert.equal((await respuesta.json()).solicitudes.length, 1);
    assert.equal(repositorio.datos.becas[0].cupos, 1);
    assert.equal((await peticion('/api/plataforma/pdf/99', { headers: cabeceras })).status, 404);
    assert.equal((await peticion('/api/plataforma/solicitudes', { method: 'POST', headers: cabeceras, body: JSON.stringify({ texto: 'a'.repeat(70000) }) })).status, 413);
    for (const ruta of ['/.env', '/servidor/iniciar.js', '/legado/Backend/package.json', '/%ZZ']) {
        assert([400, 404].includes((await peticion(ruta)).status));
    }
    assert.equal((await peticion('/api/salud')).status, 200);
    assert.equal((await peticion('/')).status, 200);
});
