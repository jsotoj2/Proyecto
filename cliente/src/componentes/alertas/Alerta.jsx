import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import estilos from './Alerta.module.css';

const ICONOS = { info: Info, exito: CircleCheck, advertencia: TriangleAlert, error: CircleAlert };

/** Mensaje en línea dentro de una página (estado de una etapa, aviso de bloqueo, etc.). */
export default function Alerta({ tipo = 'info', titulo, children, accion }) {
    const Icono = ICONOS[tipo];
    return (
        <div className={`${estilos.alerta} ${estilos[tipo]}`} role={tipo === 'error' ? 'alert' : 'status'}>
            <Icono className={estilos.icono} size={20} aria-hidden="true" />
            <div className={estilos.cuerpo}>
                {titulo && <strong className={estilos.titulo}>{titulo}</strong>}
                {children && <div className={estilos.texto}>{children}</div>}
            </div>
            {accion && <div className={estilos.accion}>{accion}</div>}
        </div>
    );
}
