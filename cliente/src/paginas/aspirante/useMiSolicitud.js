import { useCallback } from 'react';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { almacen } from '../../estado/almacen.js';
import { descargarConstancia } from '../../utilidades/constanciaPdf.js';
import { buscarBeca } from '../../utilidades/solicitud.js';

/** Solicitud del aspirante en sesión, su beca y la descarga de su constancia. */
export function useMiSolicitud() {
    const { usuario } = useSesion();
    const { datos } = useDatos();
    const solicitud = datos.solicitudes.find(item => item.usuario === usuario.usuario) ?? null;
    const beca = solicitud ? buscarBeca(datos, solicitud.becaId) : null;

    // Lee el estado vigente al momento de descargar, para incluir una solicitud recién enviada.
    const descargar = useCallback(() => {
        const actuales = almacen.obtener();
        const propia = actuales?.solicitudes.find(item => item.usuario === usuario.usuario);
        if (!propia) return;
        descargarConstancia({ beca: buscarBeca(actuales, propia.becaId), solicitud: propia, aspirante: usuario });
        // Se registra la descarga para las estadísticas; un fallo aquí no impide obtener el PDF.
        almacen.ejecutar('descarga', { becaId: propia.becaId }).catch(() => {});
    }, [usuario]);

    return { solicitud, beca, descargarConstancia: descargar };
}
