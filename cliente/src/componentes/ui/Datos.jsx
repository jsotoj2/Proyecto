import estilos from './Datos.module.css';

/** Lista de pares etiqueta–valor (expedientes, resúmenes, detalles). */
export function ListaDetalles({ elementos, columnas = 3 }) {
    return (
        <dl className={estilos.detalles} style={{ '--columnas': columnas }}>
            {elementos.filter(Boolean).map(([etiqueta, valor, completo]) => (
                <div key={etiqueta} className={completo ? estilos.completo : undefined}>
                    <dt>{etiqueta}</dt>
                    <dd>{valor === '' || valor === null || valor === undefined ? '—' : valor}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Tarjeta de indicador numérico. */
export function Indicador({ etiqueta, valor, icono: Icono, tono = 'primario', detalle }) {
    return (
        <div className={estilos.indicador}>
            {Icono && <span className={`${estilos.iconoIndicador} ${estilos[tono]}`}><Icono size={20} aria-hidden="true" /></span>}
            <div>
                <span className={estilos.etiquetaIndicador}>{etiqueta}</span>
                <strong className={estilos.valorIndicador}>{valor}</strong>
                {detalle && <small className={estilos.detalleIndicador}>{detalle}</small>}
            </div>
        </div>
    );
}

/** Barra horizontal proporcional para comparaciones simples. */
export function BarraProgreso({ etiqueta, valor, maximo, tono = 'primario' }) {
    const porcentaje = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
    return (
        <div className={estilos.barra}>
            <div className={estilos.filaBarra}>
                <span>{etiqueta}</span>
                <strong>{valor}</strong>
            </div>
            <div className={estilos.pista} role="progressbar" aria-label={etiqueta} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={maximo}>
                <span className={`${estilos.relleno} ${estilos[tono]}`} style={{ width: `${porcentaje}%` }} />
            </div>
        </div>
    );
}
