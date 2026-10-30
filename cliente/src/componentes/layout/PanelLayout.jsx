import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Bell, ChevronRight, Menu, X } from 'lucide-react';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useDatos } from '../../estado/useDatos.js';
import { NAVEGACION, contadores, seccionActual } from '../../configuracion/navegacion.js';
import { Cargando, Esqueleto } from '../ui/Pagina.jsx';
import Alerta from '../alertas/Alerta.jsx';
import Boton from '../ui/Boton.jsx';
import Marca from './Marca.jsx';
import MenuUsuario from './MenuUsuario.jsx';
import estilos from './PanelLayout.module.css';

const ANCHO_MOVIL = '(max-width: 960px)';

export default function PanelLayout() {
    const { usuario } = useSesion();
    const { datos, cargar } = useDatos();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [esMovil, setEsMovil] = useState(() => window.matchMedia(ANCHO_MOVIL).matches);
    const [errorCarga, setErrorCarga] = useState(null);
    const ubicacion = useLocation();
    const principal = useRef(null);
    const botonMenu = useRef(null);
    const barraLateral = useRef(null);

    // Cada cambio de sección reutiliza el estado reciente o lo actualiza si tiene más de 15 segundos.
    const actualizar = useCallback(forzar => {
        setErrorCarga(null);
        cargar(forzar).catch(error => setErrorCarga(error.message));
    }, [cargar]);

    useEffect(() => {
        actualizar(false);
        setMenuAbierto(false);
        principal.current?.focus({ preventScroll: true });
        // Con un ancla (#entrevista) la propia página se desplaza a la sección indicada.
        if (!window.location.hash) window.scrollTo(0, 0);
    }, [ubicacion.pathname, actualizar]);

    useEffect(() => {
        const consulta = window.matchMedia(ANCHO_MOVIL);
        const cambiar = () => {
            setEsMovil(consulta.matches);
            setMenuAbierto(false);
        };
        consulta.addEventListener('change', cambiar);
        return () => consulta.removeEventListener('change', cambiar);
    }, []);

    useEffect(() => {
        if (!menuAbierto) return undefined;
        barraLateral.current?.querySelector('a')?.focus({ preventScroll: true });
        const teclado = evento => {
            if (evento.key === 'Escape') {
                setMenuAbierto(false);
                botonMenu.current?.focus();
            }
        };
        document.addEventListener('keydown', teclado);
        return () => document.removeEventListener('keydown', teclado);
    }, [menuAbierto]);

    const numeros = contadores(datos, usuario);
    const secciones = NAVEGACION[usuario.rol] ?? [];
    const actual = seccionActual(usuario.rol, ubicacion.pathname);

    return (
        <div className={`${estilos.panel} ${menuAbierto ? estilos.menuAbierto : ''}`}>
            <a className="saltar-contenido" href="#contenido">Ir al contenido</a>

            <aside ref={barraLateral} id="barra-lateral" className={estilos.barraLateral} aria-label="Menú principal" inert={(esMovil && !menuAbierto) || undefined}>
                <div className={estilos.cabeceraLateral}>
                    <Link to="/panel" className={estilos.enlaceMarca}><Marca claro /></Link>
                    <button type="button" className={estilos.cerrarMenu} onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <nav className={estilos.navegacion}>
                    {secciones.map((seccion, indice) => (
                        <div key={seccion.titulo ?? indice} className={estilos.grupo}>
                            {seccion.titulo && <span className={estilos.tituloGrupo}>{seccion.titulo}</span>}
                            {seccion.elementos.map(({ ruta, etiqueta, icono: Icono, exacta, contador }) => (
                                <NavLink key={ruta} to={ruta} end={exacta} className={({ isActive }) => `${estilos.enlace} ${isActive ? estilos.activo : ''}`}>
                                    <Icono size={19} aria-hidden="true" />
                                    <span>{etiqueta}</span>
                                    {contador && numeros[contador] > 0 && (
                                        <span className={estilos.contador} aria-label={`${numeros[contador]} pendientes`}>{numeros[contador]}</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <p className={estilos.pieLateral}>Plataforma Nacional de Becas<br />© {new Date().getFullYear()} Becas Nacionales</p>
            </aside>

            {menuAbierto && <button type="button" className={estilos.fondo} onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />}

            <div className={estilos.columna} inert={menuAbierto || undefined}>
                <header className={estilos.barraSuperior}>
                    <button
                        ref={botonMenu}
                        type="button"
                        className={estilos.botonMenu}
                        onClick={() => setMenuAbierto(true)}
                        aria-controls="barra-lateral"
                        aria-expanded={menuAbierto}
                        aria-label="Abrir menú"
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>
                    <span className={estilos.marcaMovil}><Marca compacta /></span>
                    <nav className={estilos.migas} aria-label="Ruta de navegación">
                        <Link to="/panel">Panel</Link>
                        {actual && actual.ruta !== '/panel' && (
                            <>
                                <ChevronRight size={14} aria-hidden="true" />
                                <Link to={actual.ruta} aria-current={ubicacion.pathname === actual.ruta ? 'page' : undefined}>{actual.etiqueta}</Link>
                            </>
                        )}
                    </nav>
                    <div className={estilos.accionesSuperior}>
                        {usuario.rol === 'aspirante' && (
                            <Link to="/panel/notificaciones" className={estilos.campana} aria-label={`Notificaciones${numeros.notificaciones ? `, ${numeros.notificaciones} sin leer` : ''}`}>
                                <Bell size={20} aria-hidden="true" />
                                {numeros.notificaciones > 0 && <span className={estilos.puntoCampana}>{numeros.notificaciones}</span>}
                            </Link>
                        )}
                        <MenuUsuario />
                    </div>
                </header>

                <main id="contenido" ref={principal} className={estilos.contenido} tabIndex={-1}>
                    {errorCarga && (
                        <Alerta tipo="error" titulo="No se pudieron cargar los datos" accion={<Boton variante="secundario" tamano="sm" onClick={() => actualizar(true)}>Reintentar</Boton>}>
                            {errorCarga}
                        </Alerta>
                    )}
                    {datos ? <Suspense fallback={<Cargando />}><Outlet /></Suspense> : !errorCarga && <Esqueleto />}
                </main>
            </div>
        </div>
    );
}
