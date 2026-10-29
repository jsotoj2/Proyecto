import { ArrowRight, Bell, ClipboardCheck, FolderOpen, GraduationCap, User } from 'lucide-react';
import { Link } from 'react-router';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useMiSolicitud } from './useMiSolicitud.js';
import { etapaSolicitud, pasosSolicitud } from '../../utilidades/solicitud.js';
import { capitalizar, fechaCalendario, hora } from '../../utilidades/formato.js';
import { EncabezadoPagina } from '../../componentes/ui/Pagina.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Pasos from '../../componentes/ui/Pasos.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import estilos from './Aspirante.module.css';

function siguientePaso(solicitud) {
    const etapa = etapaSolicitud(solicitud);
    const entrevista = solicitud?.entrevista;
    const pasos = {
        formulario: ['Tu próxima oportunidad empieza aquí', 'Conoce las becas disponibles, revisa sus requisitos y completa tu formulario en línea.', 'Explorar becas', '/panel/becas'],
        revision: ['Tu formulario está en revisión', 'Un administrador está verificando tu información. Mientras tanto puedes descargar tu constancia o corregir tus datos.', 'Ver mi solicitud', '/panel/solicitud'],
        'rechazada-revision': ['Tu formulario no fue aprobado', 'Consulta el comentario de la revisión para conocer el motivo.', 'Ver comentario', '/panel/solicitud'],
        reserva: ['¡Formulario aprobado! Reserva tu entrevista', 'Elige una de las fechas disponibles para tu entrevista.', 'Reservar entrevista', '/panel/solicitud#entrevista'],
        entrevista: ['Tu entrevista está programada', entrevista ? `${capitalizar(fechaCalendario(entrevista.fecha, 'full'))} a las ${hora(entrevista.hora)} · ${entrevista.modalidad}.` : '', 'Ver detalles', '/panel/solicitud#entrevista'],
        decision: ['Tu solicitud está en evaluación final', 'El comité está analizando tu expediente. Te avisaremos en tus notificaciones.', 'Ver mi solicitud', '/panel/solicitud'],
        'segunda-aprobacion': ['Tu solicitud está en segunda aprobación', 'Por el monto solicitado, otro administrador debe autorizarla.', 'Ver mi solicitud', '/panel/solicitud'],
        finalizada: solicitud?.fase4.estado === 'aceptada'
            ? ['¡Felicidades! Tu beca fue autorizada', 'Has sido seleccionado para formar parte del programa de becas.', 'Ver resultado', '/panel/solicitud#resultado']
            : ['Tu proceso ha finalizado', 'Consulta el resultado y el comentario del comité.', 'Ver resultado', '/panel/solicitud#resultado']
    };
    const [titulo, texto, accion, ruta] = pasos[etapa];
    return { titulo, texto, accion, ruta };
}

const ACCESOS = [
    { ruta: '/panel/solicitud', titulo: 'Mi solicitud', texto: 'Avance de todas las etapas y tu constancia.', icono: ClipboardCheck },
    { ruta: '/panel/becas', titulo: 'Becas disponibles', texto: 'Programas, requisitos y cupos.', icono: GraduationCap },
    { ruta: '/panel/notificaciones', titulo: 'Notificaciones', texto: 'Avisos sobre cambios en tu solicitud.', icono: Bell },
    { ruta: '/panel/documentos', titulo: 'Mis documentos', texto: 'Adjuntos y expedientes anteriores.', icono: FolderOpen },
    { ruta: '/panel/cuenta', titulo: 'Mi información personal', texto: 'Mantén tus datos de contacto al día.', icono: User }
];

export default function InicioAspirante() {
    useTitulo('Mi panel');
    const { usuario } = useSesion();
    const { solicitud } = useMiSolicitud();
    const paso = siguientePaso(solicitud);
    const nombre = usuario.nombre.split(' ')[0];

    return (
        <div className="pila">
            <EncabezadoPagina titulo={`Hola, ${nombre}`} descripcion="Desde aquí gestionas tu solicitud de beca y consultas su avance." />

            <section className={estilos.siguiente} aria-labelledby="titulo-siguiente">
                <div>
                    <span className={estilos.etiquetaSiguiente}>Siguiente paso</span>
                    <h2 id="titulo-siguiente">{paso.titulo}</h2>
                    <p>{paso.texto}</p>
                </div>
                <Boton a={paso.ruta} iconoFinal={ArrowRight}>{paso.accion}</Boton>
            </section>

            <Tarjeta titulo="Estado de la solicitud">
                <Pasos pasos={pasosSolicitud(solicitud)} />
            </Tarjeta>

            <div className="rejilla-2">
                <Tarjeta titulo="Accesos rápidos">
                    <div className={estilos.accesos}>
                        {ACCESOS.map(({ ruta, titulo, texto, icono: Icono }) => (
                            <Link key={ruta} to={ruta} className={estilos.acceso}>
                                <span className={estilos.iconoAcceso}><Icono size={18} aria-hidden="true" /></span>
                                <span><strong>{titulo}</strong><small>{texto}</small></span>
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        ))}
                    </div>
                </Tarjeta>
                <Tarjeta titulo="Recomendaciones">
                    <ul className={estilos.lista}>
                        <li>Revisa los requisitos del programa que te interesa.</li>
                        <li>Ten a mano tu DPI, teléfono y datos académicos.</li>
                        <li>Comprueba tus datos antes de enviar el formulario.</li>
                        <li>Descarga tu constancia PDF una vez enviada la solicitud.</li>
                        <li>Consulta las observaciones de cada etapa en tus notificaciones.</li>
                    </ul>
                </Tarjeta>
            </div>
        </div>
    );
}
