import { useEffect, useState } from 'react';
import { Download, FileText, FolderOpen } from 'lucide-react';
import { api, urlDocumento } from '../../api/cliente.js';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useTitulo } from '../../hooks/useTitulo.js';
import { buscarUsuario } from '../../utilidades/solicitud.js';
import { Cargando, EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';

export default function Documentos() {
    useTitulo('Documentos y registros');
    const { usuario } = useSesion();
    const { datos } = useDatos();
    const [archivos, setArchivos] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api('documentos')
            .then(setArchivos)
            .catch(fallo => setError(fallo.message));
    }, []);

    const esAspirante = usuario.rol === 'aspirante';
    const titular = solicitudId => {
        const solicitud = datos.solicitudes.find(item => item.id === Number(solicitudId));
        return solicitud ? buscarUsuario(datos, solicitud.usuario)?.nombre ?? solicitud.usuario : '—';
    };

    return (
        <>
            <EncabezadoPagina
                antetitulo="Archivo"
                titulo="Documentos y registros"
                descripcion={esAspirante ? 'Consulta los documentos que adjuntaste a tu solicitud.' : 'Documentos adjuntos a las solicitudes.'}
            />
            {error && <Alerta tipo="error" titulo="No se pudieron cargar los documentos">{error}</Alerta>}
            {!archivos && !error && <Cargando texto="Cargando documentos…" />}
            {archivos && !archivos.length && (
                <EstadoVacio icono={FolderOpen} titulo="Sin documentos">
                    Todavía no hay documentos adjuntos.
                </EstadoVacio>
            )}
            {archivos?.length > 0 && (
                <Tarjeta titulo="Documentos adjuntos" descripcion="PDF enviados junto con las solicitudes." relleno={false}>
                    <div className="tabla-contenedor integrada">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Documento</th>
                                    {!esAspirante && <th>Aspirante</th>}
                                    <th className="celda-acciones">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {archivos.map(documento => (
                                    <tr key={documento.solicitud_id}>
                                        <td><span className="fila"><FileText size={18} aria-hidden="true" color="var(--primario-600)" />{documento.nombre}</span></td>
                                        {!esAspirante && <td>{titular(documento.solicitud_id)}</td>}
                                        <td className="celda-acciones">
                                            <Boton href={urlDocumento(documento.solicitud_id)} variante="secundario" tamano="sm" icono={Download}>Descargar</Boton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Tarjeta>
            )}
        </>
    );
}
