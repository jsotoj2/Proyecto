import { useDatos } from '../../estado/useDatos.js';
import { almacen } from '../../estado/almacen.js';
import { useOperacion } from '../../hooks/useOperacion.js';
import { alertaExito, confirmar, solicitarComentario } from '../../componentes/alertas/alertas.js';
import { moneda } from '../../utilidades/formato.js';
import { MONTO_SEGUNDA_APROBACION, requiereSegundaAprobacion } from '../../utilidades/solicitud.js';

/**
 * Decisiones de administración sobre una solicitud. Cada acción pide confirmación,
 * solicita comentario cuando corresponde y comunica el resultado con SweetAlert.
 */
export function useAccionesSolicitud() {
    const { ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();

    async function aprobarRevision(solicitud, nombre) {
        const aceptado = await confirmar({ titulo: '¿Aprobar el formulario?', texto: `${nombre} podrá reservar su entrevista.`, textoConfirmar: 'Aprobar formulario' });
        if (!aceptado) return;
        await ejecutar(() => ejecutarOperacion('fase2', { usuario: solicitud.usuario, estado: 'aceptada', comentario: 'Tu formulario cumple con los requisitos establecidos.' }), {
            exito: { titulo: 'Formulario aprobado', texto: 'El aspirante fue notificado y ya puede reservar su entrevista.' }
        });
    }

    async function rechazarRevision(solicitud, nombre) {
        const comentario = await solicitarComentario({
            titulo: 'Rechazar formulario',
            texto: `Indica a ${nombre} el motivo del rechazo o la información pendiente.`,
            etiqueta: 'Motivo o comentario',
            placeholder: 'Describe el motivo del rechazo…',
            textoConfirmar: 'Confirmar rechazo',
            peligro: true
        });
        if (comentario === null) return;
        await ejecutar(() => ejecutarOperacion('fase2', { usuario: solicitud.usuario, estado: 'rechazada', comentario }), {
            exito: { titulo: 'Revisión registrada', texto: 'El formulario fue rechazado y el aspirante recibió tu comentario.' }
        });
    }

    async function marcarEntrevista(solicitud, nombre) {
        const aceptado = await confirmar({ titulo: '¿Marcar la entrevista como realizada?', texto: `Se habilitará la decisión final de ${nombre}.`, textoConfirmar: 'Marcar realizada' });
        if (!aceptado) return;
        await ejecutar(() => ejecutarOperacion('entrevista', { usuario: solicitud.usuario }), {
            exito: { titulo: 'Entrevista registrada', texto: 'La solicitud está lista para la decisión final.' }
        });
    }

    async function aprobarBeca(solicitud, nombre) {
        const doble = requiereSegundaAprobacion(solicitud.formulario?.monto);
        const aceptado = await confirmar({
            titulo: '¿Aprobar la beca?',
            texto: doble
                ? `El monto (${moneda(solicitud.formulario.monto)}) supera ${moneda(MONTO_SEGUNDA_APROBACION)}: después de tu aprobación, otro administrador deberá autorizarla.`
                : `${nombre} será seleccionado para la beca y ocupará un cupo.`,
            textoConfirmar: 'Aprobar beca'
        });
        if (!aceptado) return;
        await ejecutar(() => ejecutarOperacion('fase4', { usuario: solicitud.usuario, estado: 'aceptada', comentario: 'Has sido seleccionado para la beca solicitada.' }), {
            exito: async () => {
                const guardada = almacen.obtener()?.solicitudes.find(item => item.usuario === solicitud.usuario);
                if (guardada?.fase4.estado === 'pendiente_aprobacion') {
                    await alertaExito('Primera aprobación registrada', `Por superar ${moneda(MONTO_SEGUNDA_APROBACION)}, otro administrador debe dar la segunda aprobación.`);
                } else {
                    await alertaExito('Beca otorgada', 'La decisión final fue guardada y el aspirante fue notificado.');
                }
            }
        });
    }

    async function rechazarBeca(solicitud, nombre) {
        const comentario = await solicitarComentario({
            titulo: 'No aprobar la beca',
            texto: `Explica a ${nombre} el motivo de la decisión.`,
            etiqueta: 'Motivo de la decisión',
            textoConfirmar: 'Confirmar decisión',
            peligro: true
        });
        if (comentario === null) return;
        await ejecutar(() => ejecutarOperacion('fase4', { usuario: solicitud.usuario, estado: 'rechazada', comentario }), {
            exito: { titulo: 'Decisión final guardada', texto: 'La solicitud no fue aprobada y el aspirante recibió tu comentario.' }
        });
    }

    async function autorizarSegunda(solicitud, nombre) {
        const comentario = await solicitarComentario({
            titulo: 'Autorizar segunda aprobación',
            texto: `Se otorgará la beca a ${nombre} por ${moneda(solicitud.formulario?.monto)}.`,
            etiqueta: 'Comentario para el aspirante',
            placeholder: 'Has sido seleccionado para la beca solicitada.',
            obligatorio: false,
            textoConfirmar: 'Autorizar'
        });
        if (comentario === null) return;
        await ejecutar(() => ejecutarOperacion('segunda-aprobacion', { usuario: solicitud.usuario, estado: 'aceptada', comentario: comentario || 'Has sido seleccionado para la beca solicitada.' }), {
            exito: { titulo: 'Beca autorizada', texto: 'La segunda aprobación quedó registrada.' }
        });
    }

    async function rechazarSegunda(solicitud, nombre) {
        const comentario = await solicitarComentario({
            titulo: 'No autorizar',
            texto: `Explica a ${nombre} por qué no se autoriza la beca.`,
            etiqueta: 'Motivo',
            textoConfirmar: 'No autorizar',
            peligro: true
        });
        if (comentario === null) return;
        await ejecutar(() => ejecutarOperacion('segunda-aprobacion', { usuario: solicitud.usuario, estado: 'rechazada', comentario }), {
            exito: { titulo: 'Solicitud no autorizada', texto: 'La decisión fue registrada y el aspirante recibió tu comentario.' }
        });
    }

    return { ejecutando, aprobarRevision, rechazarRevision, marcarEntrevista, aprobarBeca, rechazarBeca, autorizarSegunda, rechazarSegunda };
}
