import { Link } from 'react-router';
import { ArrowRight, Award, CalendarClock, Download, FileText, Gavel, Inbox, ShieldCheck, Users } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useTitulo } from '../../hooks/useTitulo.js';
import { etapaSolicitud, indicadoresGenerales } from '../../utilidades/solicitud.js';
import { EncabezadoPagina } from '../../componentes/ui/Pagina.jsx';
import { Indicador } from '../../componentes/ui/Datos.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import ListaActividad from './ListaActividad.jsx';
import estilos from './Admin.module.css';

export default function InicioAdmin() {
    useTitulo('Panel administrativo');
    const { usuario } = useSesion();
    const { datos } = useDatos();
    const indicadores = indicadoresGenerales(datos);
    const cuenta = etapa => datos.solicitudes.filter(item => etapaSolicitud(item) === etapa).length;
    const segundaPropia = datos.solicitudes.filter(item => item.fase4.estado === 'pendiente_aprobacion' && item.fase4.aprobadoPor !== usuario.usuario).length;

    const pendientes = [
        { etiqueta: 'Formularios por revisar', valor: cuenta('revision'), ruta: '/panel/solicitudes?etapa=revision', icono: Inbox },
        { etiqueta: 'Entrevistas programadas', valor: cuenta('entrevista'), ruta: '/panel/entrevistas', icono: CalendarClock },
        { etiqueta: 'Decisiones finales pendientes', valor: cuenta('decision'), ruta: '/panel/solicitudes?etapa=decision', icono: Gavel },
        { etiqueta: 'Esperan tu segunda aprobación', valor: segundaPropia, ruta: '/panel/aprobaciones', icono: ShieldCheck }
    ];

    return (
        <div className="pila">
            <EncabezadoPagina antetitulo="Administración" titulo={`Bienvenido, ${usuario.nombre.split(' ')[0]}`} descripcion="Consulta la actividad de la plataforma y atiende las solicitudes pendientes." />

            <div className="rejilla-auto">
                <Indicador etiqueta="Aspirantes registrados" valor={indicadores.aspirantes} icono={Users} />
                <Indicador etiqueta="Constancias descargadas" valor={indicadores.descargas} icono={Download} tono="info" />
                <Indicador etiqueta="Formularios enviados" valor={indicadores.enviados} icono={FileText} tono="primario" />
                <Indicador etiqueta="Becas otorgadas" valor={indicadores.otorgadas} icono={Award} tono="exito" />
            </div>

            <Tarjeta titulo="Pendientes">
                <div className={estilos.pendientes}>
                    {pendientes.map(({ etiqueta, valor, ruta, icono: Icono }) => (
                        <Link key={etiqueta} to={ruta} className={`${estilos.pendiente} ${valor ? estilos.conPendientes : ''}`}>
                            <Icono size={20} aria-hidden="true" />
                            <strong>{valor}</strong>
                            <span>{etiqueta}</span>
                            <ArrowRight size={16} aria-hidden="true" className={estilos.flecha} />
                        </Link>
                    ))}
                </div>
            </Tarjeta>

            <Tarjeta titulo="Actividad reciente">
                <ListaActividad actividad={datos.actividad} limite={6} />
            </Tarjeta>
        </div>
    );
}
