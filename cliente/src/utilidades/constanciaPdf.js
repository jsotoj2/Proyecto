import { jsPDF } from 'jspdf';
import { fechaCalendario, fechaHora, moneda, nombreArchivo } from './formato.js';
import { requiereSegundaAprobacion, textoEtapa } from './solicitud.js';

/*
 * Constancia A4 de una solicitud enviada: reproduce el formulario con los datos que el aspirante completó.
 * Se usa tanto en el panel del aspirante como en el de administración.
 */
const COLOR = {
    primario: [27, 58, 102],
    primarioOscuro: [11, 30, 58],
    primarioClaro: [228, 234, 243],
    tinta: [27, 36, 48],
    gris: [100, 110, 123],
    borde: [210, 216, 223],
    fondo: [246, 247, 249],
    blanco: [255, 255, 255]
};
const MARGEN = 16;
const ANCHO_PAGINA = 210;
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2;
const LIMITE_INFERIOR = 270;
const INTERLINEA = 4.6;

export const folioSolicitud = solicitud => `BN-${String(solicitud.id).padStart(6, '0')}`;

export function crearConstancia({ beca, solicitud, aspirante }) {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const formulario = solicitud.formulario ?? {};
    const folio = folioSolicitud(solicitud);
    let y = 0;

    const escribir = (valor, x, posicion, { tamano = 10, color = COLOR.tinta, negrita = false, alinear } = {}) => {
        pdf.setFont('helvetica', negrita ? 'bold' : 'normal');
        pdf.setFontSize(tamano);
        pdf.setTextColor(...color);
        pdf.text(valor, x, posicion, alinear ? { align: alinear } : undefined);
    };
    const lineas = (valor, ancho, tamano = 10) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(tamano);
        return pdf.splitTextToSize(String(valor ?? '').trim() || '-', ancho);
    };
    const asegurarEspacio = alto => {
        if (y + alto <= LIMITE_INFERIOR) return;
        pdf.addPage();
        cabeceraContinuacion();
    };

    function cabecera() {
        pdf.setFillColor(...COLOR.primario);
        pdf.rect(0, 0, ANCHO_PAGINA, 46, 'F');
        pdf.setFillColor(...COLOR.blanco);
        pdf.roundedRect(MARGEN, 13, 14, 14, 1, 1, 'F');
        escribir('B', MARGEN + 4.2, 23, { tamano: 17, color: COLOR.primario, negrita: true });
        escribir('BECAS NACIONALES', MARGEN + 19, 18, { tamano: 9, color: COLOR.primarioClaro, negrita: true });
        escribir('Constancia de solicitud', MARGEN + 19, 28, { tamano: 21, color: COLOR.blanco, negrita: true });
        escribir('Formulario de postulación completado en la plataforma', MARGEN + 19, 36, { tamano: 9, color: COLOR.primarioClaro });
        escribir('FOLIO', ANCHO_PAGINA - MARGEN, 18, { tamano: 8, color: COLOR.primarioClaro, negrita: true, alinear: 'right' });
        escribir(folio, ANCHO_PAGINA - MARGEN, 26, { tamano: 13, color: COLOR.blanco, negrita: true, alinear: 'right' });
        y = 58;
    }

    function cabeceraContinuacion() {
        pdf.setFillColor(...COLOR.primario);
        pdf.rect(0, 0, ANCHO_PAGINA, 20, 'F');
        escribir('Constancia de solicitud', MARGEN, 13, { tamano: 12, color: COLOR.blanco, negrita: true });
        escribir(folio, ANCHO_PAGINA - MARGEN, 13, { tamano: 10, color: COLOR.blanco, negrita: true, alinear: 'right' });
        y = 32;
    }

    function resumen() {
        const estado = textoEtapa(solicitud, 'aspirante');
        const celdas = [
            ['FECHA DE ENVÍO', fechaCalendario(solicitud.fechaFormulario, 'long')],
            ['ESTADO ACTUAL', estado.texto],
            ['MONTO SOLICITADO', moneda(formulario.monto)]
        ];
        const ancho = ANCHO_UTIL / celdas.length;
        pdf.setFillColor(...COLOR.fondo);
        pdf.setDrawColor(...COLOR.borde);
        pdf.roundedRect(MARGEN, y, ANCHO_UTIL, 18, 2.5, 2.5, 'FD');
        celdas.forEach(([etiqueta, valor], indice) => {
            const x = MARGEN + 6 + ancho * indice;
            escribir(etiqueta, x, y + 7, { tamano: 7, color: COLOR.gris, negrita: true });
            escribir(valor, x, y + 13, { tamano: 10.5, negrita: true });
        });
        y += 26;

        const nombre = lineas(beca?.nombre ?? 'Programa no disponible', ANCHO_UTIL - 12, 13);
        const alto = 14 + nombre.length * 5.5;
        pdf.setFillColor(...COLOR.primarioClaro);
        pdf.roundedRect(MARGEN, y, ANCHO_UTIL, alto, 2.5, 2.5, 'F');
        escribir('PROGRAMA SELECCIONADO', MARGEN + 6, y + 7, { tamano: 7, color: COLOR.primario, negrita: true });
        escribir(nombre, MARGEN + 6, y + 13.5, { tamano: 13, negrita: true });
        y += alto + 10;
    }

    function seccion(numero, titulo) {
        asegurarEspacio(22);
        pdf.setFillColor(...COLOR.primario);
        pdf.roundedRect(MARGEN, y - 5, 8, 8, 1.6, 1.6, 'F');
        escribir(numero, MARGEN + 1.6, y + 0.6, { tamano: 8.5, color: COLOR.blanco, negrita: true });
        escribir(titulo, MARGEN + 11, y + 0.6, { tamano: 12, negrita: true });
        pdf.setDrawColor(...COLOR.borde);
        pdf.setLineWidth(0.3);
        pdf.line(MARGEN, y + 5, ANCHO_PAGINA - MARGEN, y + 5);
        y += 12;
    }

    // Una fila de campos: cada campo indica la fracción del ancho que ocupa.
    function filaCampos(campos) {
        const separacion = 5;
        const anchoDisponible = ANCHO_UTIL - separacion * (campos.length - 1);
        const medidos = campos.map(([etiqueta, valor, fraccion]) => {
            const ancho = anchoDisponible * fraccion;
            const texto = lineas(valor, ancho - 6);
            return { etiqueta, texto, ancho, alto: Math.max(10, texto.length * INTERLINEA + 5.5) };
        });
        const alto = Math.max(...medidos.map(campo => campo.alto));
        asegurarEspacio(alto + 10);
        let x = MARGEN;
        for (const campo of medidos) {
            escribir(campo.etiqueta.toUpperCase(), x, y, { tamano: 7, color: COLOR.gris, negrita: true });
            pdf.setDrawColor(...COLOR.borde);
            pdf.setFillColor(...COLOR.blanco);
            pdf.roundedRect(x, y + 2, campo.ancho, alto, 1.6, 1.6, 'FD');
            escribir(campo.texto, x + 3, y + 8, { tamano: 10 });
            x += campo.ancho + separacion;
        }
        y += alto + 9;
    }

    // Texto largo que puede continuar en la página siguiente.
    function parrafo(etiqueta, valor) {
        asegurarEspacio(16);
        escribir(etiqueta.toUpperCase(), MARGEN, y, { tamano: 7, color: COLOR.gris, negrita: true });
        y += 6;
        for (const linea of lineas(valor, ANCHO_UTIL - 8)) {
            asegurarEspacio(INTERLINEA + 1);
            pdf.setDrawColor(...COLOR.primario);
            pdf.setLineWidth(0.8);
            pdf.line(MARGEN, y - 3.4, MARGEN, y + 1.2);
            escribir(linea, MARGEN + 5, y, { tamano: 10 });
            y += INTERLINEA + 0.6;
        }
        y += 6;
    }

    function declaracion() {
        seccion('04', 'Declaración del aspirante');
        const texto = lineas('Confirmo que la información proporcionada es correcta y completa. Entiendo que esta solicitud no garantiza la asignación de una beca y que estará sujeta a revisión, entrevista y decisión final del comité.', ANCHO_UTIL, 9.5);
        asegurarEspacio(texto.length * INTERLINEA + 44);
        escribir(texto, MARGEN, y, { tamano: 9.5, color: COLOR.gris });
        y += texto.length * INTERLINEA + 4;
        pdf.setFillColor(...COLOR.primarioClaro);
        pdf.roundedRect(MARGEN, y, ANCHO_UTIL, 11, 2, 2, 'F');
        escribir(`Aceptada electrónicamente por ${formulario.nombre || aspirante?.nombre || ''} el ${fechaCalendario(solicitud.fechaFormulario, 'long')}.`, MARGEN + 5, y + 7, { tamano: 9, color: COLOR.primario, negrita: true });
        y += 30;
        pdf.setDrawColor(...COLOR.gris);
        pdf.setLineWidth(0.3);
        pdf.line(MARGEN, y, MARGEN + 100, y);
        pdf.line(MARGEN + 118, y, ANCHO_PAGINA - MARGEN, y);
        escribir('Firma del aspirante', MARGEN, y + 5, { tamano: 8.5, color: COLOR.gris });
        escribir('Fecha', MARGEN + 118, y + 5, { tamano: 8.5, color: COLOR.gris });
    }

    function piesDePagina() {
        const total = pdf.getNumberOfPages();
        const generada = fechaHora(new Date().toISOString());
        for (let pagina = 1; pagina <= total; pagina += 1) {
            pdf.setPage(pagina);
            pdf.setDrawColor(...COLOR.borde);
            pdf.setLineWidth(0.3);
            pdf.line(MARGEN, 282, ANCHO_PAGINA - MARGEN, 282);
            escribir(`Becas Nacionales · Constancia ${folio} · Generada el ${generada}`, MARGEN, 288, { tamano: 7.5, color: COLOR.gris });
            escribir(`${pagina} / ${total}`, ANCHO_PAGINA - MARGEN, 288, { tamano: 7.5, color: COLOR.gris, alinear: 'right' });
        }
    }

    pdf.setProperties({ title: `Constancia de solicitud ${folio}`, subject: beca?.nombre ?? 'Solicitud de beca', author: 'Becas Nacionales' });
    cabecera();
    resumen();

    seccion('01', 'Datos personales');
    filaCampos([['Nombre completo', formulario.nombre || aspirante?.nombre, 1]]);
    filaCampos([['DPI / CUI', solicitud.dpi || aspirante?.dpi, 0.45], ['Edad', formulario.edad ? `${formulario.edad} años` : '', 0.2], ['Teléfono', formulario.telefono, 0.35]]);
    filaCampos([['Correo electrónico', aspirante?.correo, 1]]);
    filaCampos([['Dirección de residencia', formulario.direccion, 1]]);

    seccion('02', 'Información académica');
    filaCampos([['Últimos estudios', formulario.estudios, 0.72], ['Promedio', formulario.promedio, 0.28]]);

    seccion('03', 'Detalle de la solicitud');
    filaCampos([
        ['Monto solicitado', moneda(formulario.monto), 0.4],
        ['Aprobación requerida', requiereSegundaAprobacion(formulario.monto) ? 'Dos administradores (supera Q10,000)' : 'Un administrador', 0.6]
    ]);
    parrafo('Motivo de la solicitud', formulario.motivo);

    declaracion();
    piesDePagina();
    return pdf;
}

export function descargarConstancia(datos) {
    const pdf = crearConstancia(datos);
    const programa = nombreArchivo(datos.beca?.nombre ?? 'beca') || 'beca';
    pdf.save(`constancia-${programa}-${folioSolicitud(datos.solicitud)}.pdf`);
}
