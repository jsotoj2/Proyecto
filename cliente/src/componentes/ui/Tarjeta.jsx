import estilos from './Tarjeta.module.css';

/** Contenedor de sección con encabezado opcional (título, antetítulo, descripción y acciones). */
export default function Tarjeta({ titulo, antetitulo, descripcion, acciones, como: Etiqueta = 'section', relleno = true, className = '', children, ...resto }) {
    const tieneEncabezado = titulo || antetitulo || descripcion || acciones;
    return (
        <Etiqueta className={`${estilos.tarjeta} ${relleno ? estilos.relleno : ''} ${className}`} {...resto}>
            {tieneEncabezado && (
                <header className={estilos.encabezado}>
                    <div>
                        {antetitulo && <span className={estilos.antetitulo}>{antetitulo}</span>}
                        {titulo && <h2 className={estilos.titulo}>{titulo}</h2>}
                        {descripcion && <p className={estilos.descripcion}>{descripcion}</p>}
                    </div>
                    {acciones && <div className={estilos.acciones}>{acciones}</div>}
                </header>
            )}
            {children}
        </Etiqueta>
    );
}
