import estilos from './Insignia.module.css';

/** Etiqueta de estado. `tono`: neutro, info, exito, advertencia, error o acento. */
export default function Insignia({ tono = 'neutro', children, punto = false }) {
    return (
        <span className={`${estilos.insignia} ${estilos[tono]}`}>
            {punto && <span className={estilos.punto} aria-hidden="true" />}
            {children}
        </span>
    );
}
