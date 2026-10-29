import { Navigate, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Download, FileText } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { descargarConstancia } from '../../utilidades/constanciaPdf.js';
import { fechaCalendario } from '../../utilidades/formato.js';
import { buscarBeca, buscarUsuario, textoEtapa } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';

export default function FormulariosDeBeca() {
    const { becaId } = useParams();
    const { datos } = useDatos();
    const beca = buscarBeca(datos, becaId);
    useTitulo(beca ? `Formularios · ${beca.nombre}` : 'Formularios');
    if (!beca) return <Navigate to="/panel/formularios" replace />;

    const solicitudes = datos.solicitudes.filter(item => item.becaId === beca.id && item.formularioEnviado);

    return (
        <>
            <EncabezadoPagina
                volver={<Boton a="/panel/formularios" variante="fantasma" tamano="sm" icono={ArrowLeft} style={{ justifySelf: 'start', marginLeft: 'calc(-1 * var(--espacio-3))' }}>Regresar</Boton>}
                antetitulo="Formularios"
                titulo={beca.nombre}
                descripcion={`${solicitudes.length} ${solicitudes.length === 1 ? 'formulario enviado' : 'formularios enviados'}.`}
            />
            {solicitudes.length ? (
                <div className="tabla-contenedor">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Aspirante</th>
                                <th>DPI</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th className="celda-acciones">Formulario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {solicitudes.map(solicitud => {
                                const aspirante = buscarUsuario(datos, solicitud.usuario);
                                const estado = textoEtapa(solicitud);
                                return (
                                    <tr key={solicitud.id}>
                                        <td><strong>{aspirante?.nombre ?? solicitud.usuario}</strong></td>
                                        <td>{solicitud.dpi}</td>
                                        <td>{fechaCalendario(solicitud.fechaFormulario)}</td>
                                        <td><Insignia tono={estado.tono}>{estado.texto}</Insignia></td>
                                        <td className="celda-acciones">
                                            <span className="fila" style={{ justifyContent: 'flex-end' }}>
                                                <Boton variante="secundario" tamano="sm" icono={Download} onClick={() => descargarConstancia({ beca, solicitud, aspirante })}>PDF</Boton>
                                                <Boton a={`/panel/solicitudes/${encodeURIComponent(solicitud.usuario)}`} variante="fantasma" tamano="sm" iconoFinal={ArrowRight}>Expediente</Boton>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EstadoVacio icono={FileText} titulo="No existen formularios enviados">Cuando un aspirante envíe su solicitud para esta beca aparecerá aquí.</EstadoVacio>
            )}
        </>
    );
}
