import { Activity } from 'lucide-react';
import { EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import estilos from './Admin.module.css';

export default function ListaActividad({ actividad, limite }) {
    if (!actividad.length) return <EstadoVacio icono={Activity} titulo="Sin actividad reciente">Los movimientos de la plataforma aparecerán aquí.</EstadoVacio>;
    return (
        <ol className={estilos.actividad}>
            {actividad.slice(0, limite).map((item, indice) => (
                <li key={`${item.fecha}-${indice}`}>
                    <span className={estilos.puntoActividad} aria-hidden="true" />
                    <div><strong>{item.texto}</strong><span>{item.fecha}</span></div>
                </li>
            ))}
        </ol>
    );
}
