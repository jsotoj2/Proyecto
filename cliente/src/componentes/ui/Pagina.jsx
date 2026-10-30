import { Inbox } from 'lucide-react';
import estilos from './Pagina.module.css';

/** Encabezado común de cada página del panel. */
export function EncabezadoPagina({ antetitulo, titulo, descripcion, acciones, volver }) {
    return (
        <header className={estilos.encabezado}>
            {volver}
            <div className={estilos.filaEncabezado}>
                <div>
                    {antetitulo && <span className={estilos.antetitulo}>{antetitulo}</span>}
                    <h1 className={estilos.titulo}>{titulo}</h1>
                    {descripcion && <p className={estilos.descripcion}>{descripcion}</p>}
                </div>
                {acciones && <div className={estilos.acciones}>{acciones}</div>}
            </div>
        </header>
    );
}

/** Mensaje para listas o secciones sin contenido, con una acción sugerida opcional. */
export function EstadoVacio({ icono: Icono = Inbox, titulo, children, accion }) {
    return (
        <div className={estilos.vacio}>
            <span className={estilos.iconoVacio}><Icono size={26} aria-hidden="true" /></span>
            <h3>{titulo}</h3>
            {children && <p className={estilos.textoVacio}>{children}</p>}
            {accion}
        </div>
    );
}

/** Indicador de carga para pantallas completas o secciones. */
export function Cargando({ texto = 'Cargando…', pantalla = false }) {
    return (
        <div className={pantalla ? estilos.cargandoPantalla : estilos.cargando} role="status" aria-live="polite">
            <span className={estilos.giro} aria-hidden="true" />
            <span>{texto}</span>
        </div>
    );
}

/** Esqueleto de carga para el contenido del panel. */
export function Esqueleto({ filas = 3 }) {
    return (
        <div className={estilos.esqueleto} aria-hidden="true">
            <span className={estilos.barraEsqueleto} style={{ width: '40%', height: 28 }} />
            {Array.from({ length: filas }, (_, indice) => <span key={indice} className={estilos.bloqueEsqueleto} />)}
        </div>
    );
}
