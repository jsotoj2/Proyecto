import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Bell, ChevronDown, FolderOpen, LogOut, UserRound } from 'lucide-react';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { alertaError } from '../alertas/alertas.js';
import { iniciales, nombreRol } from '../../utilidades/formato.js';
import estilos from './MenuUsuario.module.css';

/**
 * Menú de la cuenta en la barra superior: avatar, nombre y rol; al abrirlo ofrece el perfil y el cierre de sesión.
 * Sigue el patrón de botón de menú (WAI-ARIA): flechas para moverse, Escape para cerrar y clic fuera para descartar.
 */
export default function MenuUsuario() {
    const { usuario, cerrarSesion } = useSesion();
    const [abierto, setAbierto] = useState(false);
    const contenedor = useRef(null);
    const boton = useRef(null);
    const lista = useRef(null);
    const idMenu = useId();
    const navegar = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => setAbierto(false), [pathname]);

    useEffect(() => {
        if (!abierto) return undefined;
        lista.current?.querySelector('[role="menuitem"]')?.focus();
        const fuera = evento => {
            if (!contenedor.current?.contains(evento.target)) setAbierto(false);
        };
        document.addEventListener('pointerdown', fuera);
        return () => document.removeEventListener('pointerdown', fuera);
    }, [abierto]);

    function teclado(evento) {
        const opciones = [...(lista.current?.querySelectorAll('[role="menuitem"]') ?? [])];
        const actual = opciones.indexOf(document.activeElement);
        const mover = destino => {
            evento.preventDefault();
            opciones[(destino + opciones.length) % opciones.length]?.focus();
        };
        if (evento.key === 'Escape') {
            setAbierto(false);
            boton.current?.focus();
        } else if (evento.key === 'ArrowDown') mover(actual + 1);
        else if (evento.key === 'ArrowUp') mover(actual - 1);
        else if (evento.key === 'Home') mover(0);
        else if (evento.key === 'End') mover(opciones.length - 1);
        else if (evento.key === 'Tab') setAbierto(false);
    }

    async function salir() {
        setAbierto(false);
        try {
            await cerrarSesion();
            navegar('/acceso', { replace: true });
        } catch (error) {
            alertaError(error.message);
        }
    }

    const opciones = [
        { ruta: '/panel/cuenta', etiqueta: 'Mi perfil', detalle: 'Datos personales y contraseña', icono: UserRound },
        usuario.rol === 'aspirante' && { ruta: '/panel/notificaciones', etiqueta: 'Notificaciones', detalle: 'Avisos de tu solicitud', icono: Bell },
        { ruta: '/panel/documentos', etiqueta: 'Documentos y registros', detalle: 'Adjuntos y expedientes', icono: FolderOpen }
    ].filter(Boolean);

    return (
        <div ref={contenedor} className={estilos.contenedor} onKeyDown={abierto ? teclado : undefined}>
            <button
                ref={boton}
                type="button"
                className={`${estilos.disparador} ${abierto ? estilos.disparadorAbierto : ''}`}
                aria-haspopup="menu"
                aria-expanded={abierto}
                aria-controls={idMenu}
                onClick={() => setAbierto(valor => !valor)}
                onKeyDown={evento => {
                    if (!abierto && ['ArrowDown', 'Enter', ' '].includes(evento.key)) {
                        evento.preventDefault();
                        setAbierto(true);
                    }
                }}
            >
                <span className={estilos.avatar} aria-hidden="true">{iniciales(usuario.nombre)}</span>
                <span className={estilos.identidad}>
                    <strong>{usuario.nombre}</strong>
                    <span>{nombreRol(usuario.rol)}</span>
                </span>
                <ChevronDown className={estilos.flecha} size={18} aria-hidden="true" />
            </button>

            {abierto && (
                <div ref={lista} id={idMenu} className={estilos.menu} role="menu" aria-label="Opciones de la cuenta">
                    <div className={estilos.cabecera}>
                        <span className={`${estilos.avatar} ${estilos.avatarGrande}`} aria-hidden="true">{iniciales(usuario.nombre)}</span>
                        <span className={estilos.identidadMenu}>
                            <strong>{usuario.nombre}</strong>
                            <span>{usuario.correo}</span>
                            <span className={estilos.rol}>{nombreRol(usuario.rol)}</span>
                        </span>
                    </div>
                    <div className={estilos.grupo}>
                        {opciones.map(({ ruta, etiqueta, detalle, icono: Icono }) => (
                            <Link key={ruta} to={ruta} role="menuitem" tabIndex={-1} className={estilos.opcion}>
                                <span className={estilos.iconoOpcion}><Icono size={18} aria-hidden="true" /></span>
                                <span><strong>{etiqueta}</strong><small>{detalle}</small></span>
                            </Link>
                        ))}
                    </div>
                    <div className={estilos.grupo}>
                        <button type="button" role="menuitem" tabIndex={-1} className={`${estilos.opcion} ${estilos.salir}`} onClick={salir}>
                            <span className={estilos.iconoOpcion}><LogOut size={18} aria-hidden="true" /></span>
                            <span><strong>Cerrar sesión</strong></span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
