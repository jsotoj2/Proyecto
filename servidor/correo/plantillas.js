/* Plantillas de los correos de notificación. Todo texto variable se escapa antes de insertarlo en HTML. */
const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const COLOR = { marino: '#1b3a66', texto: '#1b2430', suave: '#646e7b', borde: '#dfe3e8', fondo: '#f4f5f7' };

const formatoFecha = fecha => {
    const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 12)).toLocaleDateString('es-GT', { timeZone: 'UTC', dateStyle: 'full' });
};
const folio = solicitud => `BN-${String(solicitud.id).padStart(6, '0')}`;

/**
 * Contenido de cada aviso según el nuevo estado de la solicitud (ver estadoSolicitud en plataformaServicio).
 * Devuelve el asunto, un párrafo principal y, si corresponde, detalles adicionales.
 */
const AVISOS = {
    'formulario-enviado': ({ beca, solicitud }) => ({
        asunto: 'Recibimos tu solicitud de beca',
        parrafo: `Tu formulario para ${beca} fue recibido con el folio ${folio(solicitud)}. Un administrador lo revisará y te avisaremos del resultado.`
    }),
    'revision-aceptada': ({ solicitud }) => ({
        asunto: 'Tu formulario fue aprobado',
        parrafo: 'Tu formulario cumple con los requisitos. El siguiente paso es reservar tu entrevista desde la plataforma.',
        comentario: solicitud.fase2.comentario
    }),
    'revision-rechazada': ({ solicitud }) => ({
        asunto: 'Tu formulario no fue aprobado',
        parrafo: 'Tu formulario no cumple con los requisitos o necesita información adicional. Revisa el comentario del administrador.',
        comentario: solicitud.fase2.comentario
    }),
    'entrevista-programada': ({ solicitud }) => ({
        asunto: 'Tu entrevista quedó programada',
        parrafo: 'Registramos la reserva de tu entrevista con estos datos:',
        detalles: [
            ['Fecha', formatoFecha(solicitud.entrevista.fecha)],
            ['Hora', `${solicitud.entrevista.hora} (hora de Guatemala)`],
            ['Modalidad', solicitud.entrevista.modalidad]
        ]
    }),
    'entrevista-realizada': () => ({
        asunto: 'Tu entrevista fue registrada',
        parrafo: 'Tu entrevista fue marcada como realizada. Tu solicitud pasa a la evaluación final.'
    }),
    'resultado-pendiente_aprobacion': () => ({
        asunto: 'Tu solicitud pasó a segunda aprobación',
        parrafo: 'Tu solicitud fue aprobada y, por el monto solicitado, otro administrador debe autorizarla. Te avisaremos cuando haya una decisión.'
    }),
    'resultado-aceptada': ({ beca, solicitud }) => ({
        asunto: 'Tu beca fue autorizada',
        parrafo: `Nos complace informarte que fuiste seleccionado para ${beca}.`,
        comentario: solicitud.fase4.comentario
    }),
    'resultado-rechazada': ({ solicitud }) => ({
        asunto: 'Resultado de tu solicitud de beca',
        parrafo: 'Después de analizar tu expediente, tu solicitud no fue seleccionada en esta convocatoria. Puedes participar en futuras convocatorias.',
        comentario: solicitud.fase4.comentario
    })
};

export const tieneAviso = estado => Boolean(AVISOS[estado]);

/** Arma { asunto, texto, html } para el aviso de un cambio de etapa. */
export function correoDeEtapa(estado, { nombre, beca, solicitud, enlace }) {
    const aviso = AVISOS[estado]({ beca: beca ?? 'la beca solicitada', solicitud });
    return plantilla({ nombre, enlace, ...aviso });
}

export function plantilla({ asunto, nombre, parrafo, detalles = [], comentario, enlace }) {
    const texto = [
        `Hola, ${nombre}:`,
        '',
        parrafo,
        ...detalles.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`),
        ...(comentario ? ['', `Comentario: ${comentario}`] : []),
        ...(enlace ? ['', `Consulta tu solicitud en: ${enlace}`] : []),
        '',
        'Becas Nacionales · Plataforma Nacional de Becas',
        'Este es un mensaje automático; no respondas a este correo.'
    ].join('\n');

    const filasDetalle = detalles.map(([etiqueta, valor]) => `
        <tr>
            <td style="padding:6px 0;color:${COLOR.suave};font-size:14px;width:110px;vertical-align:top;">${escapar(etiqueta)}</td>
            <td style="padding:6px 0;color:${COLOR.texto};font-size:14px;font-weight:600;">${escapar(valor)}</td>
        </tr>`).join('');

    const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapar(asunto)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.fondo};font-family:'Segoe UI',Arial,sans-serif;color:${COLOR.texto};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.fondo};padding:24px 12px;">
        <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${COLOR.borde};border-radius:6px;">
                <tr><td style="background:${COLOR.marino};padding:18px 28px;border-radius:6px 6px 0 0;">
                    <span style="color:#ffffff;font-size:17px;font-weight:700;">Becas Nacionales</span><br>
                    <span style="color:#c5d2e4;font-size:13px;">Plataforma Nacional de Becas</span>
                </td></tr>
                <tr><td style="padding:28px;">
                    <h1 style="margin:0 0 16px;font-size:20px;color:${COLOR.texto};">${escapar(asunto)}</h1>
                    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hola, ${escapar(nombre)}:</p>
                    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${escapar(parrafo)}</p>
                    ${filasDetalle ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${filasDetalle}</table>` : ''}
                    ${comentario ? `<div style="margin:0 0 20px;padding:12px 16px;border-left:3px solid ${COLOR.marino};background:${COLOR.fondo};font-size:14px;line-height:1.5;"><strong>Comentario:</strong><br>${escapar(comentario)}</div>` : ''}
                    ${enlace ? `<a href="${escapar(enlace)}" style="display:inline-block;padding:11px 20px;background:${COLOR.marino};color:#ffffff;text-decoration:none;border-radius:4px;font-size:14px;font-weight:600;">Ver mi solicitud</a>` : ''}
                </td></tr>
                <tr><td style="padding:16px 28px;border-top:1px solid ${COLOR.borde};color:${COLOR.suave};font-size:12px;line-height:1.5;">
                    Este es un mensaje automático de la Plataforma Nacional de Becas; no respondas a este correo.
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    return { asunto: `${asunto} · Becas Nacionales`, texto, html };
}
