import { useState } from 'react';
import { History, Search } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { fechaHora, nombreRol, normalizar } from '../../utilidades/formato.js';
import { NOMBRE_OPERACION } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Campo from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import estilos from './Admin.module.css';

const textoEstado = valor => (valor ? valor.replace('resultado-pendiente_aprobacion', 'segunda aprobación').replace(/-/g, ' ') : '—');

export default function Bitacora() {
    useTitulo('Bitácora');
    const { datos } = useDatos();
    const [filtros, setFiltros] = useState({ texto: '', operacion: '', resultado: '' });
    const registros = datos.auditoria ?? [];
    const cambiar = evento => setFiltros(actual => ({ ...actual, [evento.target.name]: evento.target.value }));

    const consulta = normalizar(filtros.texto);
    const visibles = registros.filter(item =>
        (!filtros.operacion || item.operacion === filtros.operacion)
        && (!filtros.resultado || item.resultado === filtros.resultado)
        && (!consulta || [item.actorUsuario, item.usuarioSolicitud, item.detalle].some(valor => normalizar(valor).includes(consulta))));

    return (
        <>
            <EncabezadoPagina
                antetitulo="Auditoría"
                titulo="Bitácora de solicitudes"
                descripcion="Quién realizó cada aprobación, rechazo o modificación, cuándo ocurrió y cuál fue el resultado. Se muestran los 500 registros más recientes."
            />
            {registros.length ? (
                <>
                    <Tarjeta>
                        <div className={estilos.filtros} style={{ gridTemplateColumns: 'minmax(220px, 2fr) repeat(2, minmax(160px, 1fr))' }}>
                            <div className={estilos.buscador}>
                                <Search size={18} aria-hidden="true" />
                                <Campo etiqueta="Buscar" type="search" name="texto" value={filtros.texto} onChange={cambiar} placeholder="Usuario o detalle" />
                            </div>
                            <Campo etiqueta="Operación" como="select" name="operacion" value={filtros.operacion} onChange={cambiar}>
                                <option value="">Todas</option>
                                {Object.entries(NOMBRE_OPERACION).map(([clave, texto]) => <option key={clave} value={clave}>{texto}</option>)}
                            </Campo>
                            <Campo etiqueta="Resultado" como="select" name="resultado" value={filtros.resultado} onChange={cambiar}>
                                <option value="">Todos</option>
                                <option value="exito">Éxito</option>
                                <option value="rechazado">Rechazado</option>
                            </Campo>
                        </div>
                    </Tarjeta>
                    <p className={estilos.resultados} aria-live="polite">{visibles.length} de {registros.length} registros</p>
                    <div className="tabla-contenedor">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Realizado por</th>
                                    <th>Operación</th>
                                    <th>Solicitud de</th>
                                    <th>Cambio de estado</th>
                                    <th>Resultado</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibles.map((item, indice) => (
                                    <tr key={item.id ?? indice}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{fechaHora(item.fecha)}</td>
                                        <td>{item.actorUsuario}<small>{nombreRol(item.actorRol)}</small></td>
                                        <td>{NOMBRE_OPERACION[item.operacion] ?? item.operacion}</td>
                                        <td>{item.usuarioSolicitud || '—'}</td>
                                        <td>{item.resultado === 'exito' ? `${textoEstado(item.estadoAnterior)} → ${textoEstado(item.estadoNuevo)}` : '—'}</td>
                                        <td><Insignia tono={item.resultado === 'exito' ? 'exito' : 'error'}>{item.resultado === 'exito' ? 'Éxito' : 'Rechazado'}</Insignia></td>
                                        <td style={{ minWidth: 220 }}>{item.detalle}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <EstadoVacio icono={History} titulo="Sin registros">Las operaciones sobre solicitudes, becas y cuentas aparecerán aquí.</EstadoVacio>
            )}
        </>
    );
}
