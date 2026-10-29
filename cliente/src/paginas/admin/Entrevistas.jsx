import { ArrowRight, CalendarCheck, CalendarPlus, CalendarX } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { requerido } from '../../utilidades/validaciones.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useAccionesSolicitud } from './useAccionesSolicitud.js';
import { avisoExito } from '../../componentes/alertas/alertas.js';
import { fechaCalendario, hora } from '../../utilidades/formato.js';
import { buscarUsuario } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import estilos from './Admin.module.css';

// Fecha actual en Guatemala, para no ofrecer días pasados en el selector.
const hoyGuatemala = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
const ahoraGuatemala = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Guatemala', hour: '2-digit', minute: '2-digit' });

const ESQUEMA = {
    fecha: { reglas: [requerido('Selecciona la fecha.'), valor => (valor && valor < hoyGuatemala() ? 'La fecha no puede estar en el pasado.' : null)] },
    hora: { reglas: [requerido('Selecciona la hora.'), (valor, valores) => (valor && valores.fecha === hoyGuatemala() && valor <= ahoraGuatemala() ? 'La hora ya pasó; elige una posterior.' : null)] },
    modalidad: { reglas: [] }
};

function NuevoHorario() {
    const { ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();
    const { valores: horario, setValores, campo, validar } = useFormulario({ fecha: '', hora: '', modalidad: 'Presencial' }, ESQUEMA);

    async function agregar(evento) {
        evento.preventDefault();
        if (!validar()) return;
        const listo = await ejecutar(() => ejecutarOperacion('horario', horario), {
            tituloError: 'No se pudo agregar el horario',
            exito: () => avisoExito('Horario agregado.')
        });
        if (listo) setValores(actuales => ({ ...actuales, hora: '' }));
    }

    return (
        <Tarjeta titulo="Agregar disponibilidad" descripcion="Los aspirantes con formulario aprobado podrán reservar estos horarios (hora de Guatemala)." como="form" onSubmit={agregar} noValidate>
            <div className={estilos.formularioHorario}>
                <Campo etiqueta="Fecha" {...campo('fecha')} type="date" min={hoyGuatemala()} />
                <Campo etiqueta="Hora" {...campo('hora')} type="time" />
                <Campo etiqueta="Modalidad" {...campo('modalidad')} como="select">
                    <option>Presencial</option>
                    <option>Virtual</option>
                </Campo>
                <Boton type="submit" icono={CalendarPlus} cargando={ejecutando}>Agregar horario</Boton>
            </div>
        </Tarjeta>
    );
}

export default function Entrevistas() {
    useTitulo('Entrevistas');
    const { datos } = useDatos();
    const { ejecutando, marcarEntrevista } = useAccionesSolicitud();
    const citas = datos.solicitudes.filter(item => item.entrevista.fecha)
        .sort((a, b) => `${a.entrevista.fecha}${a.entrevista.hora}`.localeCompare(`${b.entrevista.fecha}${b.entrevista.hora}`));
    const nombre = usuario => buscarUsuario(datos, usuario)?.nombre ?? usuario;

    return (
        <div className="pila">
            <EncabezadoPagina antetitulo="Etapa 3" titulo="Gestión de entrevistas" descripcion="Define los espacios disponibles y registra las entrevistas realizadas." />
            <NuevoHorario />

            <Tarjeta titulo="Entrevistas programadas" relleno={false}>
                {citas.length ? (
                    <div className="tabla-contenedor integrada">
                        <table className="tabla">
                            <thead>
                                <tr><th>Aspirante</th><th>Fecha</th><th>Hora</th><th>Modalidad</th><th className="celda-acciones">Estado</th></tr>
                            </thead>
                            <tbody>
                                {citas.map(solicitud => (
                                    <tr key={solicitud.id}>
                                        <td><strong>{nombre(solicitud.usuario)}</strong></td>
                                        <td>{fechaCalendario(solicitud.entrevista.fecha)}</td>
                                        <td>{hora(solicitud.entrevista.hora)}</td>
                                        <td>{solicitud.entrevista.modalidad}</td>
                                        <td className="celda-acciones">
                                            {solicitud.entrevista.estado === 'realizada'
                                                ? <Insignia tono="exito">Realizada</Insignia>
                                                : <Boton tamano="sm" icono={CalendarCheck} disabled={ejecutando} onClick={() => marcarEntrevista(solicitud, nombre(solicitud.usuario))}>Marcar realizada</Boton>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 'var(--espacio-6)' }}><EstadoVacio icono={CalendarX} titulo="No existen entrevistas programadas">Aparecerán aquí cuando los aspirantes reserven un horario.</EstadoVacio></div>
                )}
            </Tarjeta>

            <Tarjeta titulo="Horarios" relleno={false}>
                {datos.horarios.length ? (
                    <div className="tabla-contenedor integrada">
                        <table className="tabla">
                            <thead>
                                <tr><th>Fecha</th><th>Hora</th><th>Modalidad</th><th>Estado</th><th className="celda-acciones">Aspirante</th></tr>
                            </thead>
                            <tbody>
                                {datos.horarios.map(horario => (
                                    <tr key={horario.id}>
                                        <td>{fechaCalendario(horario.fecha)}</td>
                                        <td>{hora(horario.hora)}</td>
                                        <td>{horario.modalidad}</td>
                                        <td>{horario.ocupado ? <Insignia tono="error">Ocupado</Insignia> : <Insignia tono="exito">Disponible</Insignia>}</td>
                                        <td className="celda-acciones">
                                            {horario.usuario
                                                ? <Boton a={`/panel/solicitudes/${encodeURIComponent(horario.usuario)}`} variante="fantasma" tamano="sm" iconoFinal={ArrowRight}>{nombre(horario.usuario)}</Boton>
                                                : <span className="texto-suave">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: 'var(--espacio-6)' }}><EstadoVacio icono={CalendarPlus} titulo="Sin horarios">Agrega el primer horario de entrevista con el formulario de arriba.</EstadoVacio></div>
                )}
            </Tarjeta>
        </div>
    );
}
