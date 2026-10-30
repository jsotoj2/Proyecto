import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Award, CalendarCheck, ClipboardCheck, Clock, Download, Hourglass, Lock, MapPin, Pencil, Video, X } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useMiSolicitud } from './useMiSolicitud.js';
import { confirmar } from '../../componentes/alertas/alertas.js';
import { capitalizar, fechaCalendario, hora, moneda } from '../../utilidades/formato.js';
import { folioSolicitud } from '../../utilidades/constanciaPdf.js';
import { MONTO_SEGUNDA_APROBACION, TEXTO_ENTREVISTA, TEXTO_REVISION, pasosSolicitud, textoEtapa, tonoEstado } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import { ListaDetalles } from '../../componentes/ui/Datos.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Pasos from '../../componentes/ui/Pasos.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';
import estilos from './Aspirante.module.css';

// Las entrevistas se definen en hora de Guatemala (UTC-6, sin horario de verano).
const esFuturo = horario => new Date(`${String(horario.fecha).slice(0, 10)}T${horario.hora}:00-06:00`).getTime() > Date.now();

function Bloqueada({ children }) {
    return <p className={estilos.bloqueada}><Lock size={18} aria-hidden="true" />{children}</p>;
}

function Revision({ solicitud }) {
    const { estado, comentario } = solicitud.fase2;
    const mensajes = {
        pendiente: 'Tu formulario está siendo analizado por nuestros administradores.',
        aceptada: 'Tu formulario cumple con los requisitos y puedes continuar con el proceso.',
        rechazada: 'Tu formulario no cumple con los requisitos o necesita información adicional.'
    };
    return (
        <Tarjeta antetitulo="Etapa 2" titulo="Revisión del formulario" acciones={<Insignia tono={tonoEstado(estado)}>{TEXTO_REVISION[estado]}</Insignia>}>
            <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                <p>{mensajes[estado]}</p>
                {comentario && <Alerta tipo={estado === 'rechazada' ? 'error' : 'exito'} titulo="Comentario del administrador">{comentario}</Alerta>}
            </div>
        </Tarjeta>
    );
}

function Entrevista({ solicitud }) {
    const { datos, ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();
    const [elegido, setElegido] = useState(null);
    const { entrevista } = solicitud;

    let contenido;
    if (solicitud.fase2.estado !== 'aceptada') {
        contenido = <Bloqueada>Podrás reservar tu entrevista cuando se apruebe la revisión de tu formulario.</Bloqueada>;
    } else if (entrevista.fecha) {
        const [anio, mes, dia] = String(entrevista.fecha).slice(0, 10).split('-').map(Number);
        const mesCorto = new Date(anio, mes - 1, dia).toLocaleDateString('es-GT', { month: 'short' });
        const Modalidad = entrevista.modalidad === 'Virtual' ? Video : MapPin;
        contenido = (
            <div className={estilos.cita}>
                <div className={estilos.calendario} aria-hidden="true"><span>{mesCorto}</span><strong>{dia}</strong></div>
                <div className="pila" style={{ gap: 'var(--espacio-1)' }}>
                    <strong>{capitalizar(fechaCalendario(entrevista.fecha, 'full'))}</strong>
                    <span className="fila texto-suave texto-pequeno"><Clock size={16} aria-hidden="true" />{hora(entrevista.hora)}</span>
                    <span className="fila texto-suave texto-pequeno"><Modalidad size={16} aria-hidden="true" />{entrevista.modalidad}</span>
                </div>
            </div>
        );
    } else {
        const disponibles = datos.horarios.filter(horario => !horario.ocupado && esFuturo(horario))
            .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
        const porDia = new Map();
        for (const horario of disponibles) porDia.set(horario.fecha, [...(porDia.get(horario.fecha) ?? []), horario]);

        async function reservar() {
            const horario = disponibles.find(item => item.id === elegido);
            if (!horario) return;
            const aceptado = await confirmar({
                titulo: '¿Confirmar tu entrevista?',
                texto: `${capitalizar(fechaCalendario(horario.fecha, 'full'))} a las ${hora(horario.hora)}, modalidad ${horario.modalidad.toLowerCase()}. No podrás cambiarla después.`,
                textoConfirmar: 'Confirmar cita'
            });
            if (!aceptado) return;
            await ejecutar(() => ejecutarOperacion('reservar', { horarioId: horario.id }), {
                exito: { titulo: 'Entrevista programada', texto: 'Te esperamos en la fecha seleccionada. Puedes consultarla aquí cuando quieras.' }
            });
        }

        contenido = disponibles.length ? (
            <div className="pila">
                <Alerta tipo="exito" titulo="¡Tu formulario fue aprobado!">Selecciona uno de los horarios disponibles para tu entrevista.</Alerta>
                <div className={estilos.horarios} role="radiogroup" aria-label="Horarios disponibles">
                    {[...porDia].map(([dia, horarios]) => (
                        <div key={dia} className={estilos.dia}>
                            <h3>{capitalizar(fechaCalendario(dia, 'full'))}</h3>
                            <div className={estilos.opcionesHorario}>
                                {horarios.map(horario => (
                                    <label key={horario.id} className={estilos.horario}>
                                        <input type="radio" name="horario" value={horario.id} checked={elegido === horario.id} onChange={() => setElegido(horario.id)} />
                                        <strong>{hora(horario.hora)}</strong>
                                        <span>{horario.modalidad === 'Virtual' ? <Video size={14} aria-hidden="true" /> : <MapPin size={14} aria-hidden="true" />}{horario.modalidad}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="fila">
                    <Boton icono={CalendarCheck} onClick={reservar} disabled={!elegido} cargando={ejecutando}>Confirmar cita</Boton>
                </div>
            </div>
        ) : (
            <EstadoVacio icono={CalendarCheck} titulo="Aún no hay horarios disponibles">Los administradores publicarán nuevas fechas pronto. Vuelve a consultar más tarde.</EstadoVacio>
        );
    }

    return (
        <Tarjeta id="entrevista" antetitulo="Etapa 3" titulo="Entrevista" acciones={solicitud.fase2.estado === 'aceptada' && <Insignia tono={tonoEstado(entrevista.estado)}>{TEXTO_ENTREVISTA[entrevista.estado]}</Insignia>}>
            {contenido}
        </Tarjeta>
    );
}

function Resultado({ solicitud }) {
    const { estado, comentario } = solicitud.fase4;
    let contenido;
    if (solicitud.entrevista.estado !== 'realizada') {
        contenido = <Bloqueada>La decisión final estará disponible después de completar tu entrevista.</Bloqueada>;
    } else {
        const vistas = {
            pendiente: [Hourglass, 'espera', 'Solicitud en evaluación', 'Nuestro equipo está realizando la evaluación final de tu solicitud.'],
            pendiente_aprobacion: [Hourglass, 'espera', 'Solicitud en segunda aprobación', `Tu solicitud fue aprobada y, por superar ${moneda(MONTO_SEGUNDA_APROBACION)}, otro administrador debe autorizarla. Te avisaremos en tus notificaciones.`],
            aceptada: [Award, 'exito', '¡Felicidades!', 'Tu perfil fue analizado satisfactoriamente y has sido seleccionado para formar parte de nuestro programa de becas. Bienvenido a Becas Nacionales.'],
            rechazada: [X, 'error', 'Solicitud no aprobada', 'Después de analizar tu perfil, tu solicitud no fue seleccionada en esta convocatoria. No te desanimes: puedes volver a participar en futuras convocatorias.']
        };
        const [Icono, tono, titulo, texto] = vistas[estado];
        contenido = (
            <div className={estilos.resultado}>
                <span className={`${estilos.iconoResultado} ${estilos[tono]}`}><Icono size={30} aria-hidden="true" /></span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
                {comentario && estado !== 'pendiente_aprobacion' && (
                    <Alerta tipo={estado === 'rechazada' ? 'error' : 'exito'} titulo="Comentario del comité">{comentario}</Alerta>
                )}
            </div>
        );
    }
    return <Tarjeta id="resultado" antetitulo="Etapa 4" titulo="Resultado final">{contenido}</Tarjeta>;
}

export default function MiSolicitud() {
    useTitulo('Mi solicitud');
    const { solicitud, beca, descargarConstancia } = useMiSolicitud();
    const { hash } = useLocation();

    useEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [hash]);

    if (!solicitud) {
        return (
            <>
                <EncabezadoPagina antetitulo="Seguimiento" titulo="Mi solicitud" />
                <EstadoVacio icono={ClipboardCheck} titulo="Aún no tienes una solicitud" accion={<Boton a="/panel/becas">Explorar becas</Boton>}>
                    Elige un programa de becas y completa tu formulario para comenzar.
                </EstadoVacio>
            </>
        );
    }

    const etapa = textoEtapa(solicitud, 'aspirante');
    const formulario = solicitud.formulario;

    return (
        <div className="pila">
            <EncabezadoPagina
                antetitulo={`Seguimiento · Folio ${folioSolicitud(solicitud)}`}
                titulo={beca?.nombre ?? 'Mi solicitud'}
                descripcion={`Enviada el ${fechaCalendario(solicitud.fechaFormulario, 'long')}.`}
                acciones={(
                    <>
                        {solicitud.fase2.estado === 'pendiente' && <Boton a={`/panel/solicitud/formulario?beca=${solicitud.becaId}`} variante="secundario" icono={Pencil}>Editar formulario</Boton>}
                        <Boton icono={Download} onClick={descargarConstancia}>Descargar constancia</Boton>
                    </>
                )}
            />

            <Tarjeta titulo="Progreso" acciones={<Insignia tono={etapa.tono}>{etapa.texto}</Insignia>}>
                <Pasos pasos={pasosSolicitud(solicitud)} />
            </Tarjeta>

            <Tarjeta antetitulo="Etapa 1" titulo="Formulario enviado" descripcion="Información registrada en tu solicitud.">
                <ListaDetalles elementos={[
                    ['Nombre', formulario.nombre],
                    ['DPI / CUI', solicitud.dpi],
                    ['Edad', `${formulario.edad} años`],
                    ['Teléfono', formulario.telefono],
                    ['Promedio', formulario.promedio],
                    ['Monto solicitado', moneda(formulario.monto)],
                    ['Dirección', formulario.direccion, true],
                    ['Últimos estudios', formulario.estudios, true],
                    ['Motivo', formulario.motivo, true]
                ]} />
            </Tarjeta>
            <Revision solicitud={solicitud} />
            <Entrevista solicitud={solicitud} />
            <Resultado solicitud={solicitud} />
        </div>
    );
}
