import { ArrowRight, Check, ShieldCheck, X } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useAccionesSolicitud } from './useAccionesSolicitud.js';
import { moneda } from '../../utilidades/formato.js';
import { MONTO_SEGUNDA_APROBACION, buscarBeca, buscarUsuario } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import { ListaDetalles } from '../../componentes/ui/Datos.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';
import estilos from './Admin.module.css';

export default function SegundaAprobacion() {
    useTitulo('Segunda aprobación');
    const { usuario } = useSesion();
    const { datos } = useDatos();
    const acciones = useAccionesSolicitud();
    const pendientes = datos.solicitudes.filter(item => item.fase4.estado === 'pendiente_aprobacion');

    return (
        <>
            <EncabezadoPagina
                antetitulo={`Montos mayores de ${moneda(MONTO_SEGUNDA_APROBACION)}`}
                titulo="Segunda aprobación"
                descripcion="Solicitudes aprobadas por un administrador que necesitan la autorización de otro. Mientras esperan, ocupan su cupo."
            />
            {pendientes.length ? (
                <div className="pila">
                    {pendientes.map(solicitud => {
                        const nombre = buscarUsuario(datos, solicitud.usuario)?.nombre ?? solicitud.usuario;
                        const propia = solicitud.fase4.aprobadoPor === usuario.usuario;
                        return (
                            <Tarjeta
                                key={solicitud.id}
                                className={estilos.aprobacion}
                                titulo={nombre}
                                descripcion={buscarBeca(datos, solicitud.becaId)?.nombre}
                                acciones={<Boton a={`/panel/solicitudes/${encodeURIComponent(solicitud.usuario)}`} variante="fantasma" tamano="sm" iconoFinal={ArrowRight}>Expediente</Boton>}
                            >
                                <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                                    <ListaDetalles elementos={[
                                        ['Monto solicitado', moneda(solicitud.formulario?.monto)],
                                        ['Primera aprobación', solicitud.fase4.aprobadoPor],
                                        ['DPI', solicitud.dpi]
                                    ]} />
                                    {propia ? (
                                        <Alerta tipo="info">Tú realizaste la primera aprobación. Otro administrador debe completar la segunda.</Alerta>
                                    ) : (
                                        <div className="fila">
                                            <Boton variante="exito" icono={Check} cargando={acciones.ejecutando} onClick={() => acciones.autorizarSegunda(solicitud, nombre)}>Autorizar</Boton>
                                            <Boton variante="peligro" icono={X} disabled={acciones.ejecutando} onClick={() => acciones.rechazarSegunda(solicitud, nombre)}>No autorizar</Boton>
                                        </div>
                                    )}
                                </div>
                            </Tarjeta>
                        );
                    })}
                </div>
            ) : (
                <EstadoVacio icono={ShieldCheck} titulo="No hay solicitudes pendientes">Las solicitudes que superen el monto límite aparecerán aquí tras su primera aprobación.</EstadoVacio>
            )}
        </>
    );
}
