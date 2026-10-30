import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './alertas.css';

/*
 * Diálogos de la plataforma sobre SweetAlert2. Toda confirmación, éxito o error del panel pasa por aquí
 * para que los mensajes tengan el mismo aspecto, textos de botones y comportamiento accesible.
 */
const CLASES = {
    popup: 'alerta-popup',
    title: 'alerta-titulo',
    htmlContainer: 'alerta-texto',
    actions: 'alerta-acciones',
    confirmButton: 'alerta-boton alerta-boton--primario',
    denyButton: 'alerta-boton alerta-boton--peligro',
    cancelButton: 'alerta-boton alerta-boton--secundario',
    input: 'alerta-entrada',
    validationMessage: 'alerta-validacion',
    icon: 'alerta-icono'
};

const base = Swal.mixin({ buttonsStyling: false, reverseButtons: true, focusConfirm: false, returnFocus: true, customClass: CLASES });

const avisoBreve = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    customClass: { popup: 'alerta-toast' },
    didOpen: toast => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

const claseConfirmar = peligro => `alerta-boton ${peligro ? 'alerta-boton--peligro' : 'alerta-boton--primario'}`;

export function alertaExito(titulo, texto = '') {
    return base.fire({ icon: 'success', title: titulo, text: texto, confirmButtonText: 'Entendido' });
}

export function alertaError(texto, titulo = 'No se pudo completar la operación') {
    return base.fire({ icon: 'error', title: titulo, text: texto, confirmButtonText: 'Cerrar' });
}

export function alertaAdvertencia(titulo, texto = '') {
    return base.fire({ icon: 'warning', title: titulo, text: texto, confirmButtonText: 'Entendido' });
}

export function alertaInformacion(titulo, texto = '') {
    return base.fire({ icon: 'info', title: titulo, text: texto, confirmButtonText: 'Entendido' });
}

/** Pide confirmación antes de una acción. Devuelve `true` si la persona la aceptó. */
export async function confirmar({ titulo, texto = '', textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', peligro = false, icono = 'question' }) {
    const { isConfirmed } = await base.fire({
        icon: icono,
    title: titulo,
        text: texto,
        showCancelButton: true,
        confirmButtonText: textoConfirmar,
        cancelButtonText: textoCancelar,
        customClass: { ...CLASES, confirmButton: claseConfirmar(peligro) }
    });
    return isConfirmed;
}

/** Solicita un comentario (por ejemplo, el motivo de un rechazo). Devuelve el texto o `null` si se canceló. */
export async function solicitarComentario({ titulo, texto = '', etiqueta = 'Comentario', placeholder = '', obligatorio = true, textoConfirmar = 'Guardar', peligro = false, maximo = 2000 }) {
    const { isConfirmed, value } = await base.fire({
    title: titulo,
        text: texto,
    input: 'textarea',
        inputLabel: etiqueta,
        inputPlaceholder: placeholder,
        inputAttributes: { maxlength: String(maximo), 'aria-label': etiqueta },
        showCancelButton: true,
        confirmButtonText: textoConfirmar,
        cancelButtonText: 'Cancelar',
        customClass: { ...CLASES, confirmButton: claseConfirmar(peligro) },
        inputValidator: valor => (obligatorio && !valor.trim() ? 'Escribe un comentario para continuar.' : undefined)
    });
    return isConfirmed ? value.trim() : null;
}

/** Ofrece una acción adicional tras un éxito (por ejemplo, descargar la constancia). */
export async function exitoConAccion({ titulo, texto = '', textoAccion, textoCerrar = 'Cerrar' }) {
    const { isConfirmed } = await base.fire({
        icon: 'success',
    title: titulo,
        text: texto,
        showCancelButton: true,
        confirmButtonText: textoAccion,
        cancelButtonText: textoCerrar
    });
    return isConfirmed;
}

export function avisoExito(texto) {
    return avisoBreve.fire({ icon: 'success', title: texto });
}

export function avisoError(texto) {
    return avisoBreve.fire({ icon: 'error', title: texto });
}
