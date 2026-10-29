import http from 'node:http';
import { crearConexion } from './configuracion/conexion.js';
import { enteroConfiguracion } from './configuracion/mysql.js';
import { PlataformaRepositorio } from './repositorios/plataformaRepositorio.js';
import { AutenticacionServicio } from './servicios/autenticacionServicio.js';
import { PlataformaServicio } from './servicios/plataformaServicio.js';
import { crearRutas } from './api/rutas.js';
import { crearAplicacion } from './api/aplicacion.js';
import { transporteCorreo } from './configuracion/correo.js';
import { crearDespachador } from './correo/despachador.js';

let conexion;
let despachador;
try {
    const puerto = enteroConfiguracion(process.env.PORT, 'PORT', 3000, 1, 65535);
    const origen = new URL(process.env.APP_ORIGIN ?? `http://localhost:${puerto}`).origin;
    const cookieSegura = process.env.COOKIE_SECURE === 'true';
    if (process.env.NODE_ENV === 'production' && (!cookieSegura || !origen.startsWith('https://'))) throw new Error('Producción requiere APP_ORIGIN con HTTPS y COOKIE_SECURE=true.');
    conexion = crearConexion();
    await conexion.execute('SELECT 1');
    const repositorio = new PlataformaRepositorio(conexion);
    await repositorio.comprobarEsquema();
    // Sin transporte, los correos quedan en la bandeja de salida hasta que se configure uno.
    const transporte = transporteCorreo();
    if (transporte) {
        despachador = crearDespachador({ repositorio, transporte });
        despachador.iniciar();
        console.log(`Correos de notificación: ${transporte.nombre === 'smtp' ? 'SMTP' : 'archivos HTML en correos-locales/'}`);
    } else {
        console.log('Correos de notificación desactivados: se guardarán en la bandeja de salida.');
    }
    const plataforma = new PlataformaServicio(repositorio, { urlPanel: origen, alEncolarCorreos: () => despachador?.procesar() });
    const rutas = crearRutas({ autenticacion: new AutenticacionServicio(repositorio), plataforma, repositorio, origen, cookieSegura });
    const servidor = http.createServer(crearAplicacion({ rutas, comprobarConexion: () => conexion.execute('SELECT 1') }));
    servidor.requestTimeout = 30000;
    servidor.headersTimeout = 15000;
    servidor.keepAliveTimeout = 5000;
    servidor.on('error', async error => { console.error('No se pudo iniciar el servidor:', error.code); await conexion.end(); process.exitCode = 1; });
    servidor.listen(puerto, process.env.HOST ?? '127.0.0.1', () => console.log(`Plataforma lista en ${origen}`));
    let deteniendo = false;
    const detener = () => {
        if (deteniendo) return;
        deteniendo = true;
        const limite = setTimeout(() => servidor.closeAllConnections(), 10000);
        limite.unref();
        servidor.close(async () => { clearTimeout(limite); await despachador?.detener(); await conexion.end(); });
    };
    process.once('SIGTERM', detener);
    process.once('SIGINT', detener);
} catch (error) {
    console.error('No se pudo iniciar la aplicación:', error.code ?? error.message);
    if (conexion) await conexion.end();
    process.exitCode = 1;
}
