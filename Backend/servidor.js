import http from 'node:http';
import { SolicitudRepositorioMySQL } from '../Datos/solicitudRepositorioMySQL.js';
import { SolicitudServicio } from '../Negocio/solicitudServicio.js';
import { crearAplicacion } from './aplicacion.js';

let conexion;
try {
    ({ conexion } = await import('./conexion.js'));
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
    const [becas] = await conexion.execute('SELECT nombre FROM becas WHERE activa = 1');
    const servicio = new SolicitudServicio(new SolicitudRepositorioMySQL(conexion), becas.map(beca => beca.nombre));
    const servidor = http.createServer(crearAplicacion(servicio, () => conexion.query('SELECT 1')));
    servidor.requestTimeout = 30000;
    servidor.on('error', async error => {
        console.error('No se pudo iniciar el servidor:', error.code || error.name);
        await conexion.end();process.exitCode = 1;
    });
    servidor.listen(port, '127.0.0.1', () => console.log(`Aplicación lista en http://localhost:${port}`));
    async function detener() {
        servidor.close(async () => { await conexion.end(); });
    }
    process.once('SIGINT', detener);
    process.once('SIGTERM', detener);
} catch (error) {
    console.error('No se pudo iniciar la aplicación.');
    console.error(error.code ? `Código: ${error.code}. Revisa .env, mysql2 y si ya ejecutaste npm run iniciar-db.` : error.message);
    if (conexion) await conexion.end();
    process.exitCode = 1;
}
