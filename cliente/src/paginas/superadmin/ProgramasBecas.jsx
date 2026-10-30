import { useState } from 'react';
import { GraduationCap, Plus, Save } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { entero, longitud, primerError, requerido, soloDigitos } from '../../utilidades/validaciones.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { avisoExito } from '../../componentes/alertas/alertas.js';
import { cuposOcupados } from '../../utilidades/solicitud.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import { BarraProgreso } from '../../componentes/ui/Datos.jsx';
import Campo, { RejillaCampos } from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import estilos from './Superadmin.module.css';

const VACIA = { nombre: '', cupos: '10', descripcion: '', requisitos: '' };
const separarRequisitos = texto => texto.split(/\r?\n/).map(valor => valor.trim()).filter(Boolean);

const reglaRequisitos = valor => {
    const lista = separarRequisitos(valor);
    if (lista.length > 30) return 'Incluye como máximo 30 requisitos.';
    if (lista.some(requisito => requisito.length > 500)) return 'Cada requisito admite como máximo 500 caracteres.';
    return null;
};
const ESQUEMA = {
    nombre: { reglas: [requerido('Escribe el nombre de la beca.'), longitud(3, 160)] },
    cupos: { reglas: [requerido('Indica los cupos totales.'), entero(0, 100000)], limpiar: soloDigitos(6) },
    descripcion: { reglas: [requerido('Describe la beca.'), longitud(10, 3000)] },
    requisitos: { reglas: [requerido('Escribe al menos un requisito.'), reglaRequisitos] }
};

function NuevaBeca() {
    const { ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();
    const { valores: beca, campo, validar, reiniciar } = useFormulario(VACIA, ESQUEMA);
    const requisitos = separarRequisitos(beca.requisitos);

    async function crear(evento) {
        evento.preventDefault();
        if (!validar()) return;
        const listo = await ejecutar(() => ejecutarOperacion('crear-beca', {
            nombre: beca.nombre.trim(),
            descripcion: beca.descripcion.trim(),
            cupos: Number(beca.cupos),
            requisitos
        }), {
            tituloError: 'No se pudo crear la beca',
            exito: { titulo: 'Beca creada', texto: 'El programa ya está disponible para los aspirantes.' }
        });
        if (listo) reiniciar();
    }

    return (
        <Tarjeta titulo="Crear una beca" descripcion="Al guardar, el programa estará disponible para los aspirantes." como="form" onSubmit={crear} noValidate>
            <div className="pila" style={{ gap: 'var(--espacio-5)' }}>
                <RejillaCampos>
                    <Campo etiqueta="Nombre de la beca" {...campo('nombre')} maxLength={160} placeholder="Ejemplo: Beca de Ciencias de la Salud" />
                    <Campo etiqueta="Cupos totales" {...campo('cupos')} inputMode="numeric" maxLength={6} />
                    <Campo etiqueta="Descripción" como="textarea" {...campo('descripcion')} rows={4} maxLength={3000} placeholder="Describe a quién va dirigida y qué apoyo ofrece." completo />
                    <Campo
                        etiqueta="Requisitos"
                        como="textarea"
                        {...campo('requisitos')}
                        rows={5}
                        maxLength={15030}
                        placeholder="Escribe un requisito por línea."
                        ayuda={`${requisitos.length} de 30 requisitos · máximo 500 caracteres por requisito.`}
                        completo
                    />
                </RejillaCampos>
                <div className="fila">
                    <Boton type="submit" icono={Plus} cargando={ejecutando}>Crear beca</Boton>
                </div>
            </div>
        </Tarjeta>
    );
}

function CuposBeca({ beca, ocupados }) {
    const { ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();
    const [cupos, setCupos] = useState(String(beca.cupos));
    const [error, setError] = useState(null);
    const cambiado = Number(cupos) !== beca.cupos;

    async function guardar(evento) {
        evento.preventDefault();
        // No se permiten menos cupos que las becas otorgadas o en segunda aprobación.
        const problema = primerError([requerido('Indica los cupos totales.'), entero(ocupados, 100000)], cupos);
        setError(problema);
        if (problema) return;
        await ejecutar(() => ejecutarOperacion('cupos', { becaId: beca.id, cupos: Number(cupos) }), {
            tituloError: 'No se pudieron actualizar los cupos',
            exito: () => avisoExito(`Cupos de ${beca.nombre} actualizados.`)
        });
    }

    return (
        <Tarjeta como="article" className={estilos.programa}>
            <div>
                <h3>{beca.nombre}</h3>
                <p className="texto-suave texto-pequeno">{beca.requisitos.length} requisitos</p>
            </div>
            <BarraProgreso etiqueta="Cupos ocupados" valor={ocupados} maximo={beca.cupos} tono={ocupados >= beca.cupos ? 'error' : 'primario'} />
            <form className={estilos.cupos} onSubmit={guardar} noValidate>
                <Campo etiqueta="Cupos totales" inputMode="numeric" maxLength={6} value={cupos} onChange={evento => { setCupos(soloDigitos(6)(evento.target.value)); setError(null); }} ayuda={`Mínimo ${ocupados} (otorgadas o en segunda aprobación).`} error={error ?? undefined} />
                <Boton type="submit" variante="secundario" icono={Save} cargando={ejecutando} disabled={!cambiado}>Guardar</Boton>
            </form>
        </Tarjeta>
    );
}

export default function ProgramasBecas() {
    useTitulo('Becas y cupos');
    const { datos } = useDatos();
    return (
        <div className="pila">
            <EncabezadoPagina antetitulo="Superadministración" titulo="Administración de becas" descripcion="Crea programas de becas y define los cupos totales de cada convocatoria." />
            <NuevaBeca />
            <section className="pila" aria-labelledby="titulo-programas">
                <h2 id="titulo-programas">Programas existentes</h2>
                {datos.becas.length ? (
                    <div className="rejilla-auto">
                        {datos.becas.map(beca => <CuposBeca key={`${beca.id}-${beca.cupos}`} beca={beca} ocupados={cuposOcupados(datos, beca.id)} />)}
                    </div>
                ) : (
                    <EstadoVacio icono={GraduationCap} titulo="Aún no hay becas">Crea el primer programa con el formulario de arriba.</EstadoVacio>
                )}
            </section>
        </div>
    );
}
