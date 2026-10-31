import fs from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';

/* Transportes de correo. Todos exponen `enviar({ destinatario, asunto, texto, html })`. */

export function crearTransporteSmtp({ host, puerto, seguro, usuario, contrasena, remitente }) {
    const transporte = nodemailer.createTransport({
        host,
        port: puerto,
        secure: seguro,
        auth: usuario ? { user: usuario, pass: contrasena } : undefined,
        // Evita que una conexión colgada bloquee al despachador.
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
    return {
        nombre: 'smtp',
        verificar: () => transporte.verify(),
        async enviar({ destinatario, asunto, texto, html }) {
            await transporte.sendMail({ from: remitente, to: destinatario, subject: asunto, text: texto, html });
        }
    };
}

/** Desarrollo: guarda cada correo como archivo HTML para abrirlo en el navegador, sin enviar nada. */
export function crearTransporteArchivo(directorio) {
    return {
        nombre: 'archivo',
        verificar: () => fs.mkdir(directorio, { recursive: true }),
        async enviar({ id, destinatario, asunto, html }) {
            await fs.mkdir(directorio, { recursive: true });
            const marca = new Date().toISOString().replace(/[:.]/g, '-');
            const archivo = path.join(directorio, `${marca}-${id ?? 'correo'}.html`);
            const cabecera = `<!-- Para: ${destinatario} | Asunto: ${asunto.replace(/--/g, '—')} -->\n`;
            await fs.writeFile(archivo, cabecera + html, 'utf8');
        }
    };
}
