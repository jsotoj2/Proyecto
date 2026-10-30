/*
 * Comprueba la configuración de correo del .env y envía un mensaje de prueba.
 * Uso: npm run probar-correo -- destinatario@correo.com
 */
import { transporteCorreo } from '../servidor/configuracion/correo.js';
import { plantilla } from '../servidor/correo/plantillas.js';

const destinatario = process.argv[2];
if (!destinatario || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(destinatario)) {
    console.error('Indica a qué correo enviar la prueba: npm run probar-correo -- tu@correo.com');
    process.exit(1);
}

try {
    const transporte = transporteCorreo();
    if (!transporte) {
        console.error('El correo está desactivado. Configura SMTP_HOST y CORREO_REMITENTE en .env.');
        process.exit(1);
    }
    console.log(`Transporte: ${transporte.nombre}`);
    await transporte.verificar();
    if (transporte.nombre === 'smtp') console.log('Conexión y autenticación con el servidor SMTP correctas.');

    const correo = plantilla({
        asunto: 'Correo de prueba',
        nombre: 'equipo de Becas Nacionales',
        parrafo: 'Si recibiste este mensaje, la plataforma ya puede enviar las notificaciones de cada etapa.'
    });
    await transporte.enviar({ id: 'prueba', destinatario, ...correo });
    console.log(transporte.nombre === 'smtp'
        ? `Correo de prueba enviado a ${destinatario}. Revisa también la carpeta de spam.`
        : 'No hay SMTP configurado: el correo se guardó como HTML en correos-locales/.');
} catch (error) {
    // Mensajes concretos para los errores más comunes al configurar Gmail u otro proveedor.
    const pistas = {
        EAUTH: 'Usuario o contraseña rechazados. Con Gmail usa una contraseña de aplicación (16 letras), no la contraseña normal.',
        ESOCKET: 'No se pudo conectar. Revisa SMTP_HOST, SMTP_PORT y SMTP_SECURE (465 con true, 587 con false).',
        ETIMEDOUT: 'El servidor no respondió. Revisa el puerto o si tu red bloquea conexiones SMTP.',
        EDNS: 'No se encontró el servidor. Revisa SMTP_HOST.'
    };
    console.error(`No se pudo enviar: ${error.message}`);
    if (pistas[error.code]) console.error(pistas[error.code]);
    process.exitCode = 1;
}
