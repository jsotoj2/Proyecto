import { Check } from 'lucide-react';
import estilos from './Pasos.module.css';

/**
 * Línea de progreso de la solicitud.
 * Cada paso: { titulo, descripcion, estado: 'completo' | 'actual' | 'error' | 'pendiente', detalle }.
 */
export default function Pasos({ pasos, orientacion = 'horizontal' }) {
    return (
        <ol className={`${estilos.pasos} ${estilos[orientacion]}`}>
            {pasos.map((paso, indice) => (
                <li key={paso.titulo} className={`${estilos.paso} ${estilos[paso.estado]}`} aria-current={paso.estado === 'actual' ? 'step' : undefined}>
                    <span className={estilos.marca} aria-hidden="true">
                        {paso.estado === 'completo' ? <Check size={16} strokeWidth={3} /> : indice + 1}
                    </span>
                    <div className={estilos.texto}>
                        <strong>{paso.titulo}</strong>
                        {paso.descripcion && <span>{paso.descripcion}</span>}
                        {paso.detalle}
                    </div>
                </li>
            ))}
        </ol>
    );
}
