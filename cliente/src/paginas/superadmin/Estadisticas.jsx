import { Award, Download, FileText, Users, UserX } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { ETAPAS, cuposOcupados, etapaSolicitud, indicadoresGenerales } from '../../utilidades/solicitud.js';
import { EncabezadoPagina } from '../../componentes/ui/Pagina.jsx';
import { BarraProgreso, Indicador } from '../../componentes/ui/Datos.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import ListaActividad from '../admin/ListaActividad.jsx';

const ORDEN_ETAPAS = ['revision', 'reserva', 'entrevista', 'decision', 'segunda-aprobacion', 'finalizada', 'rechazada-revision'];

export default function Estadisticas() {
    useTitulo('Estadísticas');
    const { datos } = useDatos();
    const indicadores = indicadoresGenerales(datos);
    const maximoFormularios = Math.max(indicadores.descargas, indicadores.enviados, 1);
    const maximoResultados = Math.max(indicadores.otorgadas, indicadores.rechazadas, 1);
    const porEtapa = ORDEN_ETAPAS.map(etapa => [etapa, datos.solicitudes.filter(item => etapaSolicitud(item) === etapa).length]);
    const maximoEtapa = Math.max(1, ...porEtapa.map(([, total]) => total));

    return (
        <div className="pila">
            <EncabezadoPagina antetitulo="Análisis general" titulo="Estadísticas de la plataforma" descripcion="Vista general del comportamiento de las convocatorias." />

            <div className="rejilla-auto">
                <Indicador etiqueta="Aspirantes registrados" valor={indicadores.aspirantes} icono={Users} />
                <Indicador etiqueta="Constancias descargadas" valor={indicadores.descargas} icono={Download} tono="info" />
                <Indicador etiqueta="Formularios enviados" valor={indicadores.enviados} icono={FileText} tono="primario" />
                <Indicador etiqueta="Becas otorgadas" valor={indicadores.otorgadas} icono={Award} tono="exito" />
                <Indicador etiqueta="Solicitudes no aprobadas" valor={indicadores.rechazadas} icono={UserX} tono="error" />
            </div>

            <div className="rejilla-2">
                <Tarjeta titulo="Formularios">
                    <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                        <BarraProgreso etiqueta="Constancias descargadas" valor={indicadores.descargas} maximo={maximoFormularios} tono="acento" />
                        <BarraProgreso etiqueta="Formularios enviados" valor={indicadores.enviados} maximo={maximoFormularios} />
                    </div>
                </Tarjeta>
                <Tarjeta titulo="Resultado final">
                    <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                        <BarraProgreso etiqueta="Aceptados" valor={indicadores.otorgadas} maximo={maximoResultados} tono="exito" />
                        <BarraProgreso etiqueta="Rechazados" valor={indicadores.rechazadas} maximo={maximoResultados} tono="error" />
                    </div>
                </Tarjeta>
            </div>

            <div className="rejilla-2">
                <Tarjeta titulo="Solicitudes por etapa">
                    <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                        {porEtapa.map(([etapa, total]) => <BarraProgreso key={etapa} etiqueta={ETAPAS[etapa].texto} valor={total} maximo={maximoEtapa} />)}
                    </div>
                </Tarjeta>
                <Tarjeta titulo="Ocupación de cupos por beca">
                    <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                        {datos.becas.map(beca => {
                            const ocupados = cuposOcupados(datos, beca.id);
                            return <BarraProgreso key={beca.id} etiqueta={`${beca.nombre} (${ocupados}/${beca.cupos})`} valor={ocupados} maximo={beca.cupos} tono={ocupados >= beca.cupos ? 'error' : 'primario'} />;
                        })}
                    </div>
                </Tarjeta>
            </div>

            <Tarjeta titulo="Actividad reciente">
                <ListaActividad actividad={datos.actividad} limite={10} />
            </Tarjeta>
        </div>
    );
}
