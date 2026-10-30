import { api as apiPredeterminada, OPERACIONES } from './cliente.js';

/*
 * Mantiene en memoria el estado del panel (GET /estado) y su `version`.
 * Las lecturas recientes se reutilizan y las escrituras envían la versión para detectar conflictos.
 */
export function crearAlmacenEstado({ api = apiPredeterminada, vigenciaMs = 15000 } = {}) {
    let datos = null;
    let cargadoEn = 0;
    let cargaPendiente = null;
    const oyentes = new Set();

    function publicar(nuevos) {
        datos = nuevos;
        cargadoEn = nuevos ? Date.now() : 0;
        oyentes.forEach(oyente => oyente());
    }

    async function cargar(forzar = false) {
        if (!forzar && datos && Date.now() - cargadoEn < vigenciaMs) return datos;
        cargaPendiente ??= api('estado').then(publicar).finally(() => { cargaPendiente = null; });
        await cargaPendiente;
        return datos;
    }

    async function ejecutar(tipo, carga) {
        const ruta = OPERACIONES[tipo];
        if (!ruta) throw new Error('Operación no reconocida.');
        try {
            publicar(await api(ruta[1], { ...carga, version: datos?.version }, ruta[0]));
            return datos;
        } catch (error) {
            // Otro usuario modificó los datos: se refrescan para que el siguiente intento use la versión vigente.
            if (error.estado === 409) await cargar(true).catch(() => {});
            throw error;
        }
    }

    async function leerNotificaciones() {
        publicar(await api('notificaciones/leidas', {}, 'PATCH'));
    }

    return {
        obtener: () => datos,
        suscribir(oyente) {
            oyentes.add(oyente);
            return () => oyentes.delete(oyente);
        },
        cargar,
        ejecutar,
        leerNotificaciones,
        limpiar: () => publicar(null)
    };
}
