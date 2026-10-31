/*
 * Envía periódicamente los correos de la bandeja de salida. Un fallo temporal se reintenta con espera
 * creciente (1, 2, 4, 8… minutos); al agotar los intentos el correo queda como "fallido" con su último error.
 */
export function crearDespachador({ repositorio, transporte, intervaloMs = 15000, lote = 20, maxIntentos = 5, registrar = console }) {
    let enCurso = null;
    let temporizador = null;

    async function ciclo() {
        const correos = await repositorio.reclamarCorreos(lote, maxIntentos);
        for (const correo of correos) {
            try {
                await transporte.enviar(correo);
                await repositorio.marcarCorreoEnviado(correo.id);
            } catch (error) {
                const definitivo = correo.intentos >= maxIntentos;
                await repositorio.marcarCorreoFallido(correo.id, error.message ?? error, { definitivo, esperaSegundos: 60 * 2 ** (correo.intentos - 1) });
                registrar.error?.(`Correo ${correo.id} no enviado (intento ${correo.intentos}/${maxIntentos}): ${error.code ?? error.message}`);
            }
        }
        return correos.length;
    }

    /** Procesa la cola ahora. Si ya hay un ciclo en marcha, devuelve ese mismo. */
    function procesar() {
        enCurso ??= ciclo()
            .catch(error => { registrar.error?.(`Despachador de correos: ${error.code ?? error.message}`); return 0; })
            .finally(() => { enCurso = null; });
        return enCurso;
    }

    return {
        procesar,
        iniciar() {
            if (temporizador) return;
            temporizador = setInterval(procesar, intervaloMs);
            temporizador.unref?.();
            procesar();
        },
        async detener() {
            clearInterval(temporizador);
            temporizador = null;
            await enCurso;
        }
    };
}
