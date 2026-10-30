import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, Award, CalendarCheck, Check, Download, Paperclip, UserX, X } from 'lucide-react';
import { api, urlDocumento } from '../../api/cliente.js';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useAccionesSolicitud } from './useAccionesSolicitud.js';
import { descargarConstancia, folioSolicitud } from '../../utilidades/constanciaPdf.js';
import { capitalizar, fechaCalendario, fechaHora, hora, moneda, nombreRol } from '../../utilidades/formato.js';
import { NOMBRE_OPERACION, TEXTO_RESULTADO, buscarBeca, buscarUsuario, cuposOcupados, etapaSolicitud, pasosSolicitud, requiereSegundaAprobacion, textoEtapa } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import { ListaDetalles } from '../../componentes/ui/Datos.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Pasos from '../../componentes/ui/Pasos.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';
import estilos from './Admin.module.css';

function AccionRequerida({ solicitud, nombre, disponibles }) {
    const { usuario } = useSesion();
    const acciones = useAccionesSolicitud();
    const { ejecutando } = acciones;
    const etapa = etapaSolicitud(solicitud);
    // El servidor permite cambiar la revisión mientras no exista reserva ni decisión final.
    const revisable = !solicitud.entrevista.fecha && solicitud.fase4.estado === 'pendiente';

    const botonesRevision = (
        <div className={estilos.acciones}>
            <Boton variante="exito" icono={Check} cargando={ejecutando} onClick={() => acciones.aprobarRevision(solicitud, nombre)} disabled={solicitud.fase2.estado === 'aceptada'}>Aprobar formulario</Boton>
            <Boton variante="peligro" icono={X} disabled={ejecutando || solicitud.fase2.estado === 'rechazada'} onClick={() => acciones.rechazarRevision(solicitud, nombre)}>Rechazar formulario</Boton>
        </div>
    );

    const contenido = {
        revision: <>{botonesRevision}</>,
        'rechazada-revision': (
            <>
                <Alerta tipo="error" titulo="Formulario rechazado">{solicitud.fase2.comentario}</Alerta>
                {revisable && botonesRevision}
            </>
        ),
        reserva: (
            <>
                <Alerta tipo="info" titulo="Esperando reserva">El aspirante debe elegir un horario de entrevista.</Alerta>
                {revisable && botonesRevision}
            </>
        ),
        entrevista: (
            <>
                <Alerta tipo="info" titulo="Entrevista programada">
                    {capitalizar(fechaCalendario(solicitud.entrevista.fecha, 'full'))} · {hora(solicitud.entrevista.hora)} · {solicitud.entrevista.modalidad}
                </Alerta>
                <Boton icono={CalendarCheck} cargando={ejecutando} onClick={() => acciones.marcarEntrevista(solicitud, nombre)}>Marcar entrevista realizada</Boton>
            </>
        ),
        decision: (
            <>
                <ListaDetalles columnas={2} elementos={[['Cupos disponibles', disponibles], ['Monto', moneda(solicitud.formulario?.monto)]]} />
                {requiereSegundaAprobacion(solicitud.formulario?.monto) && <Alerta tipo="advertencia">Supera Q10,000: requerirá la aprobación de un segundo administrador.</Alerta>}
                {disponibles <= 0 && <Alerta tipo="error">No quedan cupos disponibles para esta beca.</Alerta>}
                <div className={estilos.acciones}>
                    <Boton variante="exito" icono={Award} cargando={ejecutando} disabled={disponibles <= 0} onClick={() => acciones.aprobarBeca(solicitud, nombre)}>Aprobar beca</Boton>
                    <Boton variante="peligro" icono={UserX} disabled={ejecutando} onClick={() => acciones.rechazarBeca(solicitud, nombre)}>No aprobar</Boton>
                </div>
            </>
        ),
        'segunda-aprobacion': solicitud.fase4.aprobadoPor === usuario.usuario ? (
            <Alerta tipo="info" titulo="Esperando a otro administrador">Tú realizaste la primera aprobación; otro administrador debe completar la segunda.</Alerta>
        ) : (
            <>
                <Alerta tipo="advertencia" titulo="Segunda aprobación">Primera aprobación por <strong>{solicitud.fase4.aprobadoPor}</strong>.</Alerta>
                <div className={estilos.acciones}>
                    <Boton variante="exito" icono={Check} cargando={ejecutando} onClick={() => acciones.autorizarSegunda(solicitud, nombre)}>Autorizar</Boton>
                    <Boton variante="peligro" icono={X} disabled={ejecutando} onClick={() => acciones.rechazarSegunda(solicitud, nombre)}>No autorizar</Boton>
                </div>
            </>
        ),
        finalizada: (
            <Alerta tipo={solicitud.fase4.estado === 'aceptada' ? 'exito' : 'error'} titulo={TEXTO_RESULTADO[solicitud.fase4.estado]}>
                {solicitud.fase4.comentario}
            </Alerta>
        )
    }[etapa];

    return (
        <Tarjeta antetitulo="Siguiente paso" titulo={textoEtapa(solicitud).texto}>
            <div className="pila" style={{ gap: 'var(--espacio-3)' }}>{contenido}</div>
        </Tarjeta>
    );
}

export default function Expediente() {
    const { usuario: usuarioSolicitud } = useParams();
    const { datos } = useDatos();
    const [adjunto, setAdjunto] = useState(null);
    const solicitud = datos.solicitudes.find(item => item.usuario === usuarioSolicitud);
    const aspirante = buscarUsuario(datos, usuarioSolicitud);
    const nombre = aspirante?.nombre ?? usuarioSolicitud;
    useTitulo(`Expediente de ${nombre}`);

    const solicitudId = solicitud?.id;
    useEffect(() => {
        if (!solicitudId) return;
        api('documentos')
            .then(documentos => setAdjunto(documentos.find(documento => Number(documento.solicitud_id) === solicitudId) ?? null))
            .catch(() => setAdjunto(null));
    }, [solicitudId]);

    const volver = <Boton a="/panel/solicitudes" variante="fantasma" tamano="sm" icono={ArrowLeft} style={{ justifySelf: 'start', marginLeft: 'calc(-1 * var(--espacio-3))' }}>Volver a solicitudes</Boton>;

    if (!solicitud) {
        return (
            <>
                <EncabezadoPagina titulo="Expediente" volver={volver} />
                <EstadoVacio titulo="No encontramos esta solicitud">Es posible que el aspirante todavía no haya enviado su formulario.</EstadoVacio>
            </>
        );
    }

    const beca = buscarBeca(datos, solicitud.becaId);
    const formulario = solicitud.formulario ?? {};
    const disponibles = (beca?.cupos ?? 0) - cuposOcupados(datos, solicitud.becaId);
    const estado = textoEtapa(solicitud);
    const historial = (datos.auditoria ?? []).filter(item => item.usuarioSolicitud === solicitud.usuario);

    return (
        <div className="pila">
            <EncabezadoPagina
                volver={volver}
                antetitulo={`Expediente · Folio ${folioSolicitud(solicitud)}`}
                titulo={nombre}
                descripcion={`${beca?.nombre ?? 'Beca'} · enviada el ${fechaCalendario(solicitud.fechaFormulario, 'long')}`}
                acciones={(
                    <>
                        {adjunto && <Boton href={urlDocumento(solicitud.id)} variante="secundario" icono={Paperclip}>Documento adjunto</Boton>}
                        <Boton icono={Download} onClick={() => descargarConstancia({ beca, solicitud, aspirante })}>Constancia PDF</Boton>
                    </>
                )}
            />

            <Tarjeta titulo="Progreso" acciones={<Insignia tono={estado.tono}>{estado.texto}</Insignia>}>
                <Pasos pasos={pasosSolicitud(solicitud)} />
            </Tarjeta>

            <div className={estilos.expediente}>
                <div className="pila">
                    <Tarjeta antetitulo="Formulario" titulo="Datos del aspirante">
                        <ListaDetalles elementos={[
                            ['Nombre', formulario.nombre || nombre],
                            ['DPI / CUI', solicitud.dpi],
                            ['Correo', aspirante?.correo],
                            ['Edad', formulario.edad && `${formulario.edad} años`],
                            ['Teléfono', formulario.telefono],
                            ['Usuario', solicitud.usuario],
                            ['Dirección', formulario.direccion, true]
                        ]} />
                    </Tarjeta>
                    <Tarjeta antetitulo="Formulario" titulo="Información académica y solicitud">
                        <ListaDetalles elementos={[
                            ['Últimos estudios', formulario.estudios],
                            ['Promedio', formulario.promedio],
                            ['Monto solicitado', moneda(formulario.monto)],
                            ['Motivo', formulario.motivo, true]
                        ]} />
                    </Tarjeta>
                    {(solicitud.fase2.comentario || solicitud.fase4.comentario) && (
                        <Tarjeta titulo="Comentarios registrados">
                            <div className="pila" style={{ gap: 'var(--espacio-3)' }}>
                                {solicitud.fase2.comentario && <Alerta tipo={solicitud.fase2.estado === 'rechazada' ? 'error' : 'exito'} titulo="Revisión del formulario">{solicitud.fase2.comentario}</Alerta>}
                                {solicitud.fase4.comentario && <Alerta tipo={solicitud.fase4.estado === 'rechazada' ? 'error' : 'exito'} titulo="Decisión final">{solicitud.fase4.comentario}</Alerta>}
                            </div>
                        </Tarjeta>
                    )}
                </div>

                <div className={estilos.lateral}>
                    <AccionRequerida solicitud={solicitud} nombre={nombre} disponibles={disponibles} />
                    <Tarjeta titulo="Historial" descripcion="Operaciones registradas en la bitácora.">
                        {historial.length ? (
                            <ol className={estilos.historial}>
                                {historial.slice(0, 12).map(item => (
                                    <li key={item.id ?? `${item.fecha}-${item.operacion}`} className={item.resultado === 'exito' ? '' : estilos.rechazado}>
                                        <strong>{NOMBRE_OPERACION[item.operacion] ?? item.operacion}{item.resultado !== 'exito' && ' (rechazada)'}</strong>
                                        <span>{item.actorUsuario} · {nombreRol(item.actorRol)} · {fechaHora(item.fecha)}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : <p className="texto-suave texto-pequeno">Sin registros en la bitácora.</p>}
                    </Tarjeta>
                </div>
            </div>
        </div>
    );
}
