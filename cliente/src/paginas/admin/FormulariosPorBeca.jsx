import { ArrowRight, GraduationCap } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import estilos from './Admin.module.css';

export default function FormulariosPorBeca() {
    useTitulo('Formularios por beca');
    const { datos } = useDatos();

    return (
        <>
            <EncabezadoPagina antetitulo="Etapa 1" titulo="Formularios por beca" descripcion="Constancias descargadas y formularios enviados en cada programa." />
            {datos.becas.length ? (
                <div className="rejilla-auto">
                    {datos.becas.map(beca => {
                        const descargas = datos.descargas.filter(item => item.becaId === beca.id).length;
                        const enviados = datos.solicitudes.filter(item => item.becaId === beca.id && item.formularioEnviado).length;
                        return (
                            <Tarjeta key={beca.id} className={estilos.programa} como="article">
                                <div>
                                    <span className="texto-suave texto-pequeno">Beca</span>
                                    <h3>{beca.nombre}</h3>
                                </div>
                                <div className={estilos.cifras}>
                                    <div><span>Constancias</span><strong>{descargas}</strong></div>
                                    <div><span>Enviados</span><strong>{enviados}</strong></div>
                                </div>
                                <Boton a={`/panel/formularios/${beca.id}`} variante="secundario" iconoFinal={ArrowRight} bloque>Ver formularios</Boton>
                            </Tarjeta>
                        );
                    })}
                </div>
            ) : (
                <EstadoVacio icono={GraduationCap} titulo="No hay becas registradas">Las becas creadas por el superadministrador aparecerán aquí.</EstadoVacio>
            )}
        </>
    );
}
