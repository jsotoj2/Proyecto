import { useCallback, useRef, useState } from 'react';
import { alertaError, alertaExito } from '../componentes/alertas/alertas.js';

/**
 * Ejecuta una acción asíncrona sin envíos simultáneos y comunica el resultado con SweetAlert.
 * `exito` puede ser { titulo, texto } para mostrar una alerta, o una función que se llama con el resultado.
 * Devuelve `true` si la acción terminó correctamente.
 */
export function useOperacion() {
    const [ejecutando, setEjecutando] = useState(false);
    const enCurso = useRef(false);

    const ejecutar = useCallback(async (accion, { exito, tituloError } = {}) => {
        if (enCurso.current) return false;
        enCurso.current = true;
        setEjecutando(true);
        let resultado;
        let fallo;
        try {
            resultado = await accion();
        } catch (error) {
            fallo = error;
        } finally {
            enCurso.current = false;
            setEjecutando(false);
        }
        if (fallo) {
            await alertaError(fallo.message, tituloError);
            return false;
        }
        if (typeof exito === 'function') await exito(resultado);
        else if (exito) await alertaExito(exito.titulo, exito.texto);
        return true;
    }, []);

    return { ejecutando, ejecutar };
}
