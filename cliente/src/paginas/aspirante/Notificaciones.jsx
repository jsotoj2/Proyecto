import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { avisoError } from '../../componentes/alertas/alertas.js';
import { fechaHora } from '../../utilidades/formato.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import estilos from './Aspirante.module.css';

export default function Notificaciones() {
    useTitulo('Notificaciones');
    const { datos, leerNotificaciones } = useDatos();
    const notificaciones = datos.notificaciones ?? [];
    // Se conservan resaltadas las que llegaron sin leer, aunque se marquen como leídas al abrir la página.
    const [nuevas] = useState(() => new Set(notificaciones.filter(item => !item.leida).map(item => item.id ?? item.fecha)));

    useEffect(() => {
        if (nuevas.size) leerNotificaciones().catch(error => avisoError(error.message));
    }, [nuevas, leerNotificaciones]);

    return (
        <>
            <EncabezadoPagina antetitulo="Avisos" titulo="Notificaciones" descripcion="Cada cambio en tu solicitud aparece aquí y también se envía a tu correo electrónico." />
            {notificaciones.length ? (
                <ul className={estilos.notificaciones}>
                    {notificaciones.map(item => {
                        const nueva = nuevas.has(item.id ?? item.fecha);
                        return (
                            <li key={item.id ?? `${item.fecha}-${item.mensaje}`} className={`${estilos.notificacion} ${nueva ? estilos.nueva : ''}`}>
                                <span className={estilos.iconoNotificacion}>{nueva ? <BellRing size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}</span>
                                <div>
                                    {nueva && <span className="solo-lectores">Nueva: </span>}
                                    <p>{item.mensaje}</p>
                                    <time dateTime={item.fecha}>{fechaHora(item.fecha)}</time>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EstadoVacio icono={Bell} titulo="Sin notificaciones">Te avisaremos cuando tu solicitud cambie de estado.</EstadoVacio>
            )}
        </>
    );
}
