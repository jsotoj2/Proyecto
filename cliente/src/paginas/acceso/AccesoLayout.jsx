import { Link, NavLink, Outlet, useLocation } from 'react-router';
import Marca from '../../componentes/layout/Marca.jsx';
import graduacion from '../../assets/graduacion.jpg';
import campus from '../../assets/campus.jpg';
import estilos from './Acceso.module.css';

// Fotografías de Unsplash, licencia Unsplash (uso libre): photo-1541339907198-e08756dedf3f (graduación) y photo-1562774053-701939374585 (campus).
const PANTALLAS = {
    '/registro': {
        foto: campus,
        titulo: 'Registro de aspirantes',
        texto: 'Crea tu cuenta para postularte a una beca, reservar tu entrevista y consultar el resultado de tu solicitud.'
    },
    '/acceso': {
        foto: graduacion,
        titulo: 'Plataforma Nacional de Becas',
        texto: 'Solicitud, revisión, entrevista y resultado de las becas nacionales en un solo lugar.'
    }
};

export default function AccesoLayout() {
    const { pathname } = useLocation();
    const pantalla = PANTALLAS[pathname] ?? PANTALLAS['/acceso'];
    const enlace = ({ isActive }) => `${estilos.enlaceNav} ${isActive ? estilos.enlaceActivo : ''}`;

    return (
        <div className={estilos.pantalla} style={{ '--foto': `url(${pantalla.foto})` }}>
            <header className={estilos.cabecera}>
                <Link to="/acceso" className={estilos.marca} aria-label="Becas Nacionales, inicio"><Marca claro /></Link>
                <nav className={estilos.navegacion} aria-label="Acceso">
                    <NavLink to="/acceso" className={enlace}>Iniciar sesión</NavLink>
                    <NavLink to="/registro" className={enlace}>Crear cuenta</NavLink>
                </nav>
            </header>

            <main className={estilos.contenido}>
                <section className={estilos.mensaje} aria-labelledby="titulo-acceso">
                    <h1 id="titulo-acceso">{pantalla.titulo}</h1>
                    <p>{pantalla.texto}</p>
                </section>

                <div className={estilos.tarjeta}>
                    <Outlet />
                </div>
            </main>

            <footer className={estilos.pie}>
                © {new Date().getFullYear()} Becas Nacionales. Todos los derechos reservados.
            </footer>
        </div>
    );
}
