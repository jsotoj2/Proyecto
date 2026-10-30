import { useSearchParams } from 'react-router';
import { ArrowRight, Inbox, Search } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { fechaCalendario, moneda, normalizar } from '../../utilidades/formato.js';
import { ETAPAS, buscarBeca, buscarUsuario, etapaSolicitud, textoEtapa } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import estilos from './Admin.module.css';

const FILTROS_ETAPA = ['revision', 'reserva', 'entrevista', 'decision', 'segunda-aprobacion', 'finalizada', 'rechazada-revision'];

export default function BandejaSolicitudes() {
    useTitulo('Solicitudes');
    const { datos } = useDatos();
    const [parametros, setParametros] = useSearchParams();
    const texto = parametros.get('buscar') ?? '';
    const etapa = parametros.get('etapa') ?? '';
    const becaId = parametros.get('beca') ?? '';

    const cambiarFiltro = (clave, valor) => {
        const siguientes = new URLSearchParams(parametros);
        if (valor) siguientes.set(clave, valor); else siguientes.delete(clave);
        setParametros(siguientes, { replace: true });
    };

    const filas = datos.solicitudes
        .filter(solicitud => solicitud.formularioEnviado)
        .map(solicitud => ({ solicitud, aspirante: buscarUsuario(datos, solicitud.usuario), beca: buscarBeca(datos, solicitud.becaId), etapa: etapaSolicitud(solicitud) }))
        .sort((a, b) => String(b.solicitud.fechaFormulario).localeCompare(String(a.solicitud.fechaFormulario)));

    const consulta = normalizar(texto);
    const visibles = filas.filter(fila =>
        (!etapa || fila.etapa === etapa)
        && (!becaId || fila.solicitud.becaId === Number(becaId))
        && (!consulta || [fila.solicitud.dpi, fila.solicitud.usuario, fila.aspirante?.nombre, fila.aspirante?.correo].some(valor => normalizar(valor).includes(consulta))));

    return (
        <>
            <EncabezadoPagina
                antetitulo="Gestión"
                titulo="Solicitudes"
                descripcion="Busca por DPI, nombre o usuario y abre el expediente para revisar, programar o decidir."
            />
            <Tarjeta>
                <div className="pila" style={{ gap: 'var(--espacio-4)' }}>
                    <div className={estilos.filtros}>
                        <div className={estilos.buscador}>
                            <Search size={18} aria-hidden="true" />
                            <Campo etiqueta="Buscar aspirante" type="search" value={texto} onChange={evento => cambiarFiltro('buscar', evento.target.value)} placeholder="DPI, nombre, usuario o correo" />
                        </div>
                        <Campo etiqueta="Beca" como="select" value={becaId} onChange={evento => cambiarFiltro('beca', evento.target.value)}>
                            <option value="">Todas las becas</option>
                            {datos.becas.map(beca => <option key={beca.id} value={beca.id}>{beca.nombre}</option>)}
                        </Campo>
                    </div>
                    <div className={estilos.chips} aria-label="Filtrar por etapa">
                        <button type="button" className={estilos.chip} aria-pressed={!etapa} onClick={() => cambiarFiltro('etapa', '')}>
                            Todas <span>{filas.length}</span>
                        </button>
                        {FILTROS_ETAPA.map(clave => (
                            <button key={clave} type="button" className={estilos.chip} aria-pressed={etapa === clave} onClick={() => cambiarFiltro('etapa', clave)}>
                                {ETAPAS[clave].texto} <span>{filas.filter(fila => fila.etapa === clave).length}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </Tarjeta>

            <p className={estilos.resultados} aria-live="polite">{visibles.length} {visibles.length === 1 ? 'solicitud' : 'solicitudes'}</p>

            {visibles.length ? (
                <div className="tabla-contenedor">
                    <table className="tabla">
                        <thead>
                            <tr>
                                <th>Aspirante</th>
                                <th>Beca</th>
                                <th>Enviada</th>
                                <th>Monto</th>
                                <th>Etapa</th>
                                <th className="celda-acciones"><span className="solo-lectores">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibles.map(({ solicitud, aspirante, beca }) => {
                                const estado = textoEtapa(solicitud);
                                return (
                                    <tr key={solicitud.id}>
                                        <td>
                                            <span className={estilos.aspirante}>
                                                <strong>{aspirante?.nombre ?? solicitud.usuario}</strong>
                                                <small>DPI {solicitud.dpi}</small>
                                            </span>
                                        </td>
                                        <td>{beca?.nombre ?? '—'}</td>
                                        <td>{fechaCalendario(solicitud.fechaFormulario)}</td>
                                        <td>{moneda(solicitud.formulario?.monto)}</td>
                                        <td><Insignia tono={estado.tono}>{estado.texto}</Insignia></td>
                                        <td className="celda-acciones">
                                            <Boton a={`/panel/solicitudes/${encodeURIComponent(solicitud.usuario)}`} variante="secundario" tamano="sm" iconoFinal={ArrowRight}>Expediente</Boton>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EstadoVacio icono={Inbox} titulo={filas.length ? 'Ninguna solicitud coincide' : 'Todavía no hay solicitudes'}>
                    {filas.length ? 'Prueba con otro DPI, nombre o etapa.' : 'Las solicitudes enviadas por los aspirantes aparecerán aquí.'}
                </EstadoVacio>
            )}
        </>
    );
}
