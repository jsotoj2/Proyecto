import { Link } from 'react-router';
import estilos from './Boton.module.css';

/**
 * Botón de la plataforma. Con `a` se comporta como enlace interno; con `href`, como enlace externo o de descarga.
 * `cargando` deshabilita el botón y anuncia el estado a lectores de pantalla.
 */
export default function Boton({ variante = 'primario', tamano = 'md', icono: Icono, iconoFinal: IconoFinal, cargando = false, bloque = false, a, href, className = '', disabled, children, ...resto }) {
    const clases = [estilos.boton, estilos[variante], estilos[tamano], bloque && estilos.bloque, className].filter(Boolean).join(' ');
    const contenido = (
        <>
            {cargando ? <span className={estilos.giro} aria-hidden="true" /> : Icono && <Icono size={tamano === 'sm' ? 16 : 18} aria-hidden="true" />}
            {children && <span>{cargando ? 'Procesando…' : children}</span>}
            {!cargando && IconoFinal && <IconoFinal size={tamano === 'sm' ? 16 : 18} aria-hidden="true" />}
        </>
    );
    if (a) return <Link to={a} className={clases} {...resto}>{contenido}</Link>;
    if (href) return <a href={href} className={clases} {...resto}>{contenido}</a>;
    return (
        <button type="button" className={clases} disabled={cargando || disabled} aria-busy={cargando || undefined} {...resto}>
            {contenido}
        </button>
    );
}
