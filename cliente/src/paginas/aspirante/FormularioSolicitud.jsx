import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, FileUp, Paperclip, Send, X } from 'lucide-react';
import { subirPdf } from '../../api/cliente.js';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { useMiSolicitud } from './useMiSolicitud.js';
import { alertaAdvertencia, alertaError, confirmar, exitoConAccion } from '../../componentes/alertas/alertas.js';
import { moneda } from '../../utilidades/formato.js';
import { decimal, entero, longitud, primerError, requerido, soloDecimal, soloDigitos, telefono } from '../../utilidades/validaciones.js';
import { buscarBeca, MONTO_SEGUNDA_APROBACION, requiereSegundaAprobacion } from '../../utilidades/solicitud.js';
import { EncabezadoPagina } from '../../componentes/ui/Pagina.jsx';
import { ListaDetalles } from '../../componentes/ui/Datos.jsx';
import Campo, { RejillaCampos } from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Pasos from '../../componentes/ui/Pasos.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';
import estilos from './Aspirante.module.css';

const PASOS = [
    { titulo: 'Datos personales', descripcion: 'Identificación y contacto' },
    { titulo: 'Información académica', descripcion: 'Estudios y promedio' },
    { titulo: 'Detalle de la solicitud', descripcion: 'Monto, motivo y adjunto' },
    { titulo: 'Revisión y envío', descripcion: 'Confirma tu información' }
];
const VACIO = { edad: '', telefono: '', direccion: '', estudios: '', promedio: '', monto: '', motivo: '' };
const MAXIMO_MOTIVO = 3000;
const ESQUEMA = {
    edad: { reglas: [requerido('Escribe tu edad.'), entero(14, 100)], limpiar: soloDigitos(3) },
    telefono: { reglas: [requerido('Escribe tu número de teléfono.'), telefono], limpiar: soloDigitos(8) },
    direccion: { reglas: [requerido('Escribe tu dirección de residencia.'), longitud(10, 500)] },
    estudios: { reglas: [requerido('Indica tus últimos estudios.'), longitud(3, 300)] },
    promedio: { reglas: [requerido('Escribe tu promedio.'), decimal(0, 100)], limpiar: soloDecimal(2) },
    monto: { reglas: [requerido('Escribe el monto solicitado.'), decimal(1, 10000000)], limpiar: soloDecimal(2) },
    motivo: { reglas: [requerido('Explica por qué solicitas la beca.'), longitud(20, MAXIMO_MOTIVO)] }
};
// Campos que se validan antes de pasar al siguiente paso.
const CAMPOS_POR_PASO = [['edad', 'telefono', 'direccion'], ['estudios', 'promedio'], ['monto', 'motivo'], []];
const NIVELES = ['Diversificado (bachillerato, perito o magisterio)', 'Técnico universitario', 'Licenciatura en curso', 'Licenciatura finalizada', 'Maestría en curso'];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

// El borrador permanece solo en este navegador; si el almacenamiento no está disponible, el formulario sigue funcionando.
const claveBorrador = usuario => `becas:borrador-solicitud:${usuario}`;
function leerBorrador(usuario) {
    try { return JSON.parse(localStorage.getItem(claveBorrador(usuario))) ?? null; } catch { return null; }
}
function guardarBorrador(usuario, valor) {
    try { localStorage.setItem(claveBorrador(usuario), JSON.stringify(valor)); } catch { /* sin almacenamiento */ }
}
function borrarBorrador(usuario) {
    try { localStorage.removeItem(claveBorrador(usuario)); } catch { /* sin almacenamiento */ }
}

async function validarPdf(archivo) {
    if (archivo.size > TAMANO_MAXIMO) return 'El archivo supera 5 MB.';
    if (!archivo.name.toLowerCase().endsWith('.pdf') || await archivo.slice(0, 5).text() !== '%PDF-') return 'Selecciona un archivo PDF válido.';
    return null;
}

export default function FormularioSolicitud() {
    useTitulo('Formulario de solicitud');
    const { usuario } = useSesion();
    const { datos, ejecutar: ejecutarOperacion } = useDatos();
    const { solicitud, descargarConstancia } = useMiSolicitud();
    const [parametros] = useSearchParams();
    const navegar = useNavigate();
    const { ejecutando, ejecutar } = useOperacion();

    const beca = buscarBeca(datos, parametros.get('beca') ?? solicitud?.becaId);
    const [paso, setPaso] = useState(0);
    const [inicial] = useState(() => {
        const previos = { ...VACIO, ...(solicitud?.formulario ?? {}), ...(leerBorrador(usuario.usuario)?.campos ?? {}) };
        // Los datos anteriores pueden traer el teléfono con espacios o guiones.
        return { ...previos, telefono: soloDigitos(8)(String(previos.telefono)) };
    });
    const { valores: campos, campo, validar } = useFormulario(inicial, ESQUEMA);
    const [archivo, setArchivo] = useState(null);
    const [arrastrando, setArrastrando] = useState(false);
    const [declaracion, setDeclaracion] = useState(false);
    const [errorDeclaracion, setErrorDeclaracion] = useState(null);

    useEffect(() => {
        guardarBorrador(usuario.usuario, { campos });
    }, [campos, usuario.usuario]);

    if (!beca) return <Navigate to="/panel/becas" replace />;
    if (solicitud && solicitud.fase2.estado !== 'pendiente') {
        return (
            <>
                <EncabezadoPagina antetitulo="Formulario" titulo="Tu formulario ya fue revisado" />
                <Alerta tipo="info" titulo="No es posible modificarlo" accion={<Boton a="/panel/solicitud" variante="secundario" tamano="sm">Ver mi solicitud</Boton>}>
                    Una vez revisado, el formulario queda cerrado. Puedes descargar tu constancia desde Mi solicitud.
                </Alerta>
            </>
        );
    }

    async function elegirArchivo(elegido) {
        if (!elegido) return;
        const problema = await validarPdf(elegido);
        if (problema) {
            alertaError(problema, 'Archivo no válido');
            return;
        }
        setArchivo(elegido);
    }

    function avanzar() {
        if (!validar(CAMPOS_POR_PASO[paso])) return;
        setPaso(actual => actual + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function enviar(evento) {
        evento.preventDefault();
        if (paso < PASOS.length - 1) {
            avanzar();
            return;
        }
        if (!declaracion) {
            setErrorDeclaracion('Debes confirmar la declaración para enviar la solicitud.');
            return;
        }
        // Revalida todo por si el borrador traía datos que ya no cumplen las reglas.
        const pasoConError = CAMPOS_POR_PASO.findIndex(lista => lista.some(nombre => primerError(ESQUEMA[nombre].reglas, campos[nombre], campos)));
        if (pasoConError >= 0) {
            setPaso(pasoConError);
            setTimeout(() => validar(CAMPOS_POR_PASO[pasoConError]), 0);
            return;
        }
        const aceptado = await confirmar({
            titulo: '¿Enviar tu solicitud?',
            texto: `Postularás a ${beca.nombre}. Podrás corregir tus datos mientras el formulario no haya sido revisado.`,
            textoConfirmar: 'Enviar solicitud'
        });
        if (!aceptado) return;

        let errorAdjunto = null;
        await ejecutar(async () => {
            const enviados = Object.fromEntries(Object.entries(campos).filter(([clave]) => clave in VACIO).map(([clave, valor]) => [clave, String(valor).trim()]));
            const estado = await ejecutarOperacion('formulario', { becaId: beca.id, formulario: enviados });
            if (archivo) {
                const propia = estado.solicitudes.find(item => item.usuario === usuario.usuario);
                try { await subirPdf(propia.id, archivo); } catch (error) { errorAdjunto = error.message; }
            }
        }, {
            tituloError: 'No se pudo enviar tu solicitud',
            exito: async () => {
                borrarBorrador(usuario.usuario);
                if (errorAdjunto) await alertaAdvertencia('Tu solicitud se guardó, pero no el PDF', `${errorAdjunto} Puedes intentar adjuntarlo de nuevo editando tu formulario.`);
                const descargar = await exitoConAccion({
                    titulo: '¡Solicitud enviada!',
                    texto: 'Tu formulario será revisado por un administrador. Descarga tu constancia en PDF como comprobante.',
                    textoAccion: 'Descargar constancia PDF',
                    textoCerrar: 'Ahora no'
                });
                navegar('/panel/solicitud');
                if (descargar) descargarConstancia();
            }
        });
    }

    const segundaAprobacion = requiereSegundaAprobacion(campos.monto);

    return (
        <>
            <EncabezadoPagina
                antetitulo={solicitud ? 'Editar solicitud' : 'Nueva solicitud'}
                titulo={beca.nombre}
                descripcion="Completa el formulario en cuatro pasos. Al enviarlo podrás descargar una constancia en PDF con toda tu información."
                volver={<Boton a={`/panel/becas?beca=${beca.id}`} variante="fantasma" tamano="sm" icono={ArrowLeft} style={{ justifySelf: 'start', marginLeft: 'calc(-1 * var(--espacio-3))' }}>Cambiar de beca</Boton>}
            />
            <div className={estilos.formulario}>
                <Tarjeta className={estilos.indicePasos} como="aside" aria-label="Progreso del formulario">
                    <Pasos orientacion="vertical" pasos={PASOS.map((item, indice) => ({ ...item, estado: indice < paso ? 'completo' : indice === paso ? 'actual' : 'pendiente' }))} />
                </Tarjeta>

                <Tarjeta como="form" onSubmit={enviar} noValidate aria-label="Formulario de solicitud">
                    <div className="pila">
                        <div className={estilos.progresoCompacto} aria-hidden="true">
                            <span>Paso {paso + 1} de {PASOS.length} · {PASOS[paso].titulo}</span>
                            <div className={estilos.pistaProgreso}><i style={{ width: `${((paso + 1) / PASOS.length) * 100}%` }} /></div>
                        </div>
                        {paso === 0 && (
                            <fieldset className={estilos.fieldset}>
                                <legend>Datos personales</legend>
                                <Alerta tipo="info">Tu nombre, DPI y correo provienen de tu cuenta. Puedes actualizar el nombre y el correo en <strong>Mi perfil</strong>.</Alerta>
                                <RejillaCampos>
                                    <Campo etiqueta="Nombre completo" value={usuario.nombre} readOnly completo />
                                    <Campo etiqueta="DPI / CUI" value={usuario.dpi} readOnly />
                                    <Campo etiqueta="Correo electrónico" value={usuario.correo} readOnly />
                                    <Campo etiqueta="Edad" {...campo('edad')} inputMode="numeric" maxLength={3} placeholder="Años cumplidos" />
                                    <Campo etiqueta="Teléfono" {...campo('telefono')} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={8} placeholder="8 dígitos, sin espacios" />
                                    <Campo etiqueta="Dirección de residencia" {...campo('direccion')} autoComplete="street-address" maxLength={500} placeholder="Zona, municipio y departamento" completo />
                                </RejillaCampos>
                            </fieldset>
                        )}

                        {paso === 1 && (
                            <fieldset className={estilos.fieldset}>
                                <legend>Información académica</legend>
                                <RejillaCampos>
                                    <Campo etiqueta="Últimos estudios" {...campo('estudios')} list="niveles-estudio" maxLength={300} placeholder="Ejemplo: Bachillerato en Ciencias y Letras" ayuda="Indica el nivel y la institución." completo />
                                    <Campo etiqueta="Promedio" {...campo('promedio')} inputMode="decimal" maxLength={6} placeholder="De 0 a 100" />
                                </RejillaCampos>
                                <datalist id="niveles-estudio">
                                    {NIVELES.map(nivel => <option key={nivel} value={nivel} />)}
                                </datalist>
                            </fieldset>
                        )}

                        {paso === 2 && (
                            <fieldset className={estilos.fieldset}>
                                <legend>Detalle de la solicitud</legend>
                                <RejillaCampos>
                                    <Campo etiqueta="Monto solicitado (Q)" {...campo('monto')} inputMode="decimal" maxLength={11} placeholder="Ejemplo: 5000.00" ayuda={`Los montos mayores de ${moneda(MONTO_SEGUNDA_APROBACION)} requieren una segunda aprobación.`} />
                                </RejillaCampos>
                                {segundaAprobacion && <Alerta tipo="advertencia">Por superar {moneda(MONTO_SEGUNDA_APROBACION)}, tu solicitud necesitará la autorización de dos administradores.</Alerta>}
                                <Campo etiqueta="¿Por qué solicitas esta beca?" como="textarea" {...campo('motivo')} rows={7} maxLength={MAXIMO_MOTIVO} placeholder="Describe tus metas académicas, tu situación y cómo te ayudará la beca (mínimo 20 caracteres)." />
                                <span className={estilos.contador} aria-live="polite">{campos.motivo.length} / {MAXIMO_MOTIVO}</span>
                                <div className="pila" style={{ gap: 'var(--espacio-2)' }}>
                                    <span className="texto-pequeno" style={{ fontWeight: 600, color: 'var(--gris-700)' }}>Documentación de respaldo <span className="texto-suave" style={{ fontWeight: 400 }}>(opcional, PDF de máximo 5 MB)</span></span>
                                    {archivo ? (
                                        <div className={estilos.archivoElegido}>
                                            <Paperclip size={18} aria-hidden="true" color="var(--primario-600)" />
                                            <span>{archivo.name}</span>
                                            <Boton variante="fantasma" tamano="sm" icono={X} onClick={() => setArchivo(null)} aria-label="Quitar archivo">Quitar</Boton>
                                        </div>
                                    ) : (
                                        <label
                                            className={`${estilos.zonaArchivo} ${arrastrando ? estilos.arrastrando : ''}`}
                                            onDragOver={evento => { evento.preventDefault(); setArrastrando(true); }}
                                            onDragLeave={() => setArrastrando(false)}
                                            onDrop={evento => { evento.preventDefault(); setArrastrando(false); elegirArchivo(evento.dataTransfer.files[0]); }}
                                        >
                                            <FileUp size={28} aria-hidden="true" color="var(--primario-600)" />
                                            <span><strong>Selecciona un PDF</strong> o arrástralo aquí</span>
                                            <input type="file" accept="application/pdf,.pdf" className="solo-lectores" onChange={evento => { elegirArchivo(evento.target.files[0]); evento.target.value = ''; }} />
                                        </label>
                                    )}
                                </div>
                            </fieldset>
                        )}

                        {paso === 3 && (
                            <fieldset className={estilos.fieldset}>
                                <legend>Revisa tu información</legend>
                                <ListaDetalles columnas={2} elementos={[
                                    ['Programa', beca.nombre, true],
                                    ['Nombre completo', usuario.nombre],
                                    ['DPI / CUI', usuario.dpi],
                                    ['Correo electrónico', usuario.correo],
                                    ['Edad', campos.edad && `${campos.edad} años`],
                                    ['Teléfono', campos.telefono],
                                    ['Dirección', campos.direccion],
                                    ['Últimos estudios', campos.estudios],
                                    ['Promedio', campos.promedio],
                                    ['Monto solicitado', moneda(campos.monto)],
                                    ['Documento adjunto', archivo?.name ?? 'Ninguno'],
                                    ['Motivo', campos.motivo, true]
                                ]} />
                                <label className={estilos.declaracion}>
                                    <input
                                        type="checkbox"
                                        checked={declaracion}
                                        aria-invalid={errorDeclaracion ? true : undefined}
                                        aria-describedby={errorDeclaracion ? 'error-declaracion' : undefined}
                                        onChange={evento => { setDeclaracion(evento.target.checked); setErrorDeclaracion(null); }}
                                    />
                                    <span>Confirmo que la información proporcionada es correcta y completa. Entiendo que esta solicitud no garantiza la asignación de una beca y que estará sujeta a revisión.</span>
                                </label>
                                {errorDeclaracion && <small id="error-declaracion" className={estilos.errorDeclaracion}>{errorDeclaracion}</small>}
                            </fieldset>
                        )}

                        <div className={estilos.navegacionPasos}>
                            {paso > 0
                                ? <Boton variante="secundario" icono={ArrowLeft} onClick={() => setPaso(actual => actual - 1)} disabled={ejecutando}>Anterior</Boton>
                                : <span />}
                            {paso < PASOS.length - 1
                                ? <Boton type="submit" iconoFinal={ArrowRight}>Siguiente</Boton>
                                : <Boton type="submit" icono={Send} cargando={ejecutando}>Enviar solicitud</Boton>}
                        </div>
                    </div>
                </Tarjeta>
            </div>
        </>
    );
}
