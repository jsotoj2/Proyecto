import { Navigate, Outlet, useLocation } from 'react-router';
import { useSesion } from '../estado/SesionContexto.jsx';
import { Cargando } from '../componentes/ui/Pagina.jsx';

/** Exige una sesión activa; si no existe, envía al acceso y recuerda la ruta solicitada. */
export function RequiereSesion() {
    const { usuario, verificando } = useSesion();
    const ubicacion = useLocation();
    if (verificando) return <Cargando pantalla texto="Verificando tu sesión…" />;
    if (!usuario) return <Navigate to="/acceso" replace state={{ desde: ubicacion.pathname }} />;
    return <Outlet />;
}

/** Las páginas de acceso redirigen al panel cuando ya hay una sesión. */
export function SoloInvitados() {
    const { usuario, verificando } = useSesion();
    if (verificando) return <Cargando pantalla texto="Verificando tu sesión…" />;
    if (usuario) return <Navigate to="/panel" replace />;
    return <Outlet />;
}

/** Restringe una sección a ciertos roles. El servidor vuelve a comprobar cada permiso. */
export function RequiereRol({ roles }) {
    const { usuario } = useSesion();
    if (!roles.includes(usuario.rol)) return <Navigate to="/panel" replace />;
    return <Outlet />;
}

/** Muestra una página distinta según el rol de la sesión. */
export function SegunRol({ paginas }) {
    const { usuario } = useSesion();
    const Pagina = paginas[usuario.rol] ?? paginas.admin;
    return <Pagina />;
}
