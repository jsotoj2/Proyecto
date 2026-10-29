import { useSearchParams } from 'react-router';
import { ArrowRight, CircleCheck, ClipboardCheck, GraduationCap, Users } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useMiSolicitud } from './useMiSolicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';
import estilos from './Aspirante.module.css';

export default function CatalogoBecas() {
    useTitulo('Becas disponibles');
    const { datos } = useDatos();
    const { solicitud, beca: becaSolicitada } = useMiSolicitud();
    const [parametros, setParametros] = useSearchParams();
    const becas = datos.becas;
    const seleccionada = becas.find(beca => beca.id === Number(parametros.get('beca'))) ?? becas.find(beca => beca.id === solicitud?.becaId) ?? becas[0];
    const editable = !solicitud || solicitud.fase2.estado === 'pendiente';

    if (!becas.length) {
        return (
            <>
                <EncabezadoPagina antetitulo="Convocatorias" titulo="Becas disponibles" />
                <EstadoVacio icono={GraduationCap} titulo="Aún no hay becas publicadas">Cuando se abra una convocatoria aparecerá aquí.</EstadoVacio>
            </>
        );
    }

    return (
        <>
            <EncabezadoPagina
                antetitulo="Convocatorias"
                titulo="Becas disponibles"
                descripcion="Revisa los programas y sus requisitos. Cuando elijas uno, completa tu formulario en línea y obtén tu constancia en PDF."
            />
            {solicitud && (
                <Alerta
                    tipo={editable ? 'info' : 'exito'}
                    titulo={`Ya enviaste una solicitud para ${becaSolicitada?.nombre ?? 'una beca'}`}
                    accion={<Boton a="/panel/solicitud" variante="secundario" tamano="sm">Ver mi solicitud</Boton>}
                >
                    {editable
                        ? 'Mientras no sea revisada puedes corregir tus datos o cambiar de programa.'
                        : 'Tu formulario ya fue revisado, por lo que no puede modificarse.'}
                </Alerta>
            )}
            <div className={estilos.catalogo}>
                <nav className={estilos.listaBecas} aria-label="Programas de becas">
                    {becas.map(beca => (
                        <button
                            key={beca.id}
                            type="button"
                            className={estilos.opcionBeca}
                            aria-pressed={beca.id === seleccionada.id}
                            onClick={() => setParametros({ beca: String(beca.id) }, { replace: true })}
                        >
                            <span className="fila-separada">
                                <strong>{beca.nombre}</strong>
                                {beca.id === solicitud?.becaId && <Insignia tono="primario">Tu solicitud</Insignia>}
                            </span>
                            <small>{beca.requisitos.length} requisitos · {beca.cupos} cupos</small>
                        </button>
                    ))}
                </nav>

                <Tarjeta className={estilos.detalleBeca} antetitulo="Programa" titulo={seleccionada.nombre} acciones={<Insignia tono="exito">Convocatoria abierta</Insignia>}>
                    <div className="pila">
                        <p className={estilos.descripcion}>{seleccionada.descripcion}</p>
                        <div className="fila texto-suave texto-pequeno">
                            <Users size={16} aria-hidden="true" /> {seleccionada.cupos} cupos totales
                        </div>
                        <div>
                            <h3>Requisitos</h3>
                            <ul className={estilos.requisitos}>
                                {seleccionada.requisitos.map(requisito => (
                                    <li key={requisito}><CircleCheck size={16} aria-hidden="true" />{requisito}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="fila">
                            {editable ? (
                                <Boton a={`/panel/solicitud/formulario?beca=${seleccionada.id}`} icono={ClipboardCheck} iconoFinal={ArrowRight} tamano="lg">
                                    {solicitud ? (seleccionada.id === solicitud.becaId ? 'Editar mi formulario' : 'Postularme a esta beca') : 'Completar formulario'}
                                </Boton>
                            ) : (
                                <Boton a="/panel/solicitud" variante="secundario">Consultar mi solicitud</Boton>
                            )}
                        </div>
                    </div>
                </Tarjeta>
            </div>
        </>
    );
}
