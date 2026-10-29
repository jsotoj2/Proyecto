/* Reglas de presentación de una solicitud. Las reglas de negocio se aplican en el servidor. */

// Debe coincidir con MONTO_SEGUNDA_APROBACION del servidor.
export const MONTO_SEGUNDA_APROBACION = 10000;

export const TEXTO_REVISION = { pendiente: 'Pendiente de revisión', aceptada: 'Aprobada', rechazada: 'Rechazada' };
export const TEXTO_ENTREVISTA = { pendiente: 'Sin programar', programada: 'Programada', realizada: 'Realizada' };
export const NOMBRE_OPERACION = {
    formulario: 'Formulario enviado',
    fase2: 'Revisión del formulario',
    reservar: 'Reserva de entrevista',
    entrevista: 'Entrevista realizada',
    fase4: 'Decisión final',
    'segunda-aprobacion': 'Segunda aprobación',
    horario: 'Horario publicado',
    'crear-beca': 'Beca creada',
    cupos: 'Cupos actualizados',
    'crear-usuario': 'Cuenta creada',
    'activar-usuario': 'Cuenta activada o desactivada'
};
export const TEXTO_RESULTADO = { pendiente: 'En evaluación', pendiente_aprobacion: 'En segunda aprobación', aceptada: 'Beca otorgada', rechazada: 'No aprobada' };

const TONOS = {
    pendiente: 'advertencia', programada: 'info', pendiente_aprobacion: 'acento',
    aceptada: 'exito', realizada: 'exito', rechazada: 'error'
};

export const tonoEstado = estado => TONOS[estado] ?? 'neutro';

/**
 * Etapa en la que se encuentra la solicitud; determina la acción siguiente para aspirantes y administradores.
 */
export function etapaSolicitud(solicitud) {
    if (!solicitud?.formularioEnviado) return 'formulario';
    if (solicitud.fase2.estado === 'pendiente') return 'revision';
    if (solicitud.fase2.estado === 'rechazada') return 'rechazada-revision';
    if (!solicitud.entrevista.fecha) return 'reserva';
    if (solicitud.entrevista.estado !== 'realizada') return 'entrevista';
    if (solicitud.fase4.estado === 'pendiente') return 'decision';
    if (solicitud.fase4.estado === 'pendiente_aprobacion') return 'segunda-aprobacion';
    return 'finalizada';
}

export const ETAPAS = {
    formulario: { texto: 'Sin formulario', tono: 'neutro' },
    revision: { texto: 'Por revisar', tono: 'advertencia' },
    'rechazada-revision': { texto: 'Rechazada en revisión', tono: 'error' },
    reserva: { texto: 'Esperando reserva', tono: 'info' },
    entrevista: { texto: 'Entrevista programada', tono: 'info' },
    decision: { texto: 'Por decidir', tono: 'advertencia' },
    'segunda-aprobacion': { texto: 'Segunda aprobación', tono: 'acento' },
    finalizada: { texto: 'Finalizada', tono: 'exito' }
};

// El aspirante ve su propio avance; el resto de etapas comparte el texto de administración.
const ETAPAS_ASPIRANTE = {
    revision: 'En revisión',
    reserva: 'Reserva tu entrevista',
    decision: 'En evaluación final'
};

export function textoEtapa(solicitud, vista = 'admin') {
    const etapa = etapaSolicitud(solicitud);
    if (etapa === 'finalizada') {
        return { texto: TEXTO_RESULTADO[solicitud.fase4.estado], tono: tonoEstado(solicitud.fase4.estado) };
    }
    const texto = vista === 'aspirante' ? ETAPAS_ASPIRANTE[etapa] : undefined;
    return { ...ETAPAS[etapa], ...(texto && { texto }) };
}

/** Pasos del proceso para el componente <Pasos>. */
export function pasosSolicitud(solicitud) {
    const enviada = Boolean(solicitud?.formularioEnviado);
    const revision = solicitud?.fase2.estado;
    const entrevista = solicitud?.entrevista.estado;
    const resultado = solicitud?.fase4.estado;
    const estadoPaso = (completo, error, alcanzado) => (completo ? 'completo' : error ? 'error' : alcanzado ? 'actual' : 'pendiente');
    return [
        { titulo: 'Formulario', descripcion: enviada ? 'Enviado' : 'Pendiente de envío', estado: estadoPaso(enviada, false, true) },
        { titulo: 'Revisión', descripcion: enviada ? TEXTO_REVISION[revision] : 'Pendiente', estado: estadoPaso(revision === 'aceptada', revision === 'rechazada', enviada) },
        { titulo: 'Entrevista', descripcion: revision === 'aceptada' ? TEXTO_ENTREVISTA[entrevista] : 'Pendiente', estado: estadoPaso(entrevista === 'realizada', false, revision === 'aceptada') },
        { titulo: 'Resultado', descripcion: entrevista === 'realizada' ? TEXTO_RESULTADO[resultado] : 'Pendiente', estado: estadoPaso(resultado === 'aceptada', resultado === 'rechazada', entrevista === 'realizada') }
    ];
}

// Las solicitudes en segunda aprobación también ocupan cupo.
export function cuposOcupados(datos, becaId) {
    return datos.solicitudes.filter(item => item.becaId === becaId && ['aceptada', 'pendiente_aprobacion'].includes(item.fase4.estado)).length;
}

export const requiereSegundaAprobacion = monto => Number(monto) > MONTO_SEGUNDA_APROBACION;

export function buscarUsuario(datos, usuario) {
    return datos.usuarios.find(item => item.usuario === usuario);
}

export function buscarBeca(datos, id) {
    return datos.becas.find(item => item.id === Number(id));
}

export function indicadoresGenerales(datos) {
    return {
        aspirantes: datos.usuarios.filter(item => item.rol === 'aspirante').length,
        descargas: datos.descargas.length,
        enviados: datos.solicitudes.filter(item => item.formularioEnviado).length,
        otorgadas: datos.solicitudes.filter(item => item.fase4.estado === 'aceptada').length,
        rechazadas: datos.solicitudes.filter(item => item.fase4.estado === 'rechazada').length
    };
}
