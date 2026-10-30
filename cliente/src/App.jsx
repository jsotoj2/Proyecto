import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { RequiereRol, RequiereSesion, SegunRol, SoloInvitados } from './rutas/Protecciones.jsx';
import PanelLayout from './componentes/layout/PanelLayout.jsx';
import AccesoLayout from './paginas/acceso/AccesoLayout.jsx';
import IniciarSesion from './paginas/acceso/IniciarSesion.jsx';
import Registro from './paginas/acceso/Registro.jsx';
import NoEncontrada from './paginas/NoEncontrada.jsx';

// Cada módulo de rol se descarga solo cuando se visita.
const Cuenta = lazy(() => import('./paginas/comun/Cuenta.jsx'));
const Documentos = lazy(() => import('./paginas/comun/Documentos.jsx'));

const InicioAspirante = lazy(() => import('./paginas/aspirante/InicioAspirante.jsx'));
const CatalogoBecas = lazy(() => import('./paginas/aspirante/CatalogoBecas.jsx'));
const FormularioSolicitud = lazy(() => import('./paginas/aspirante/FormularioSolicitud.jsx'));
const MiSolicitud = lazy(() => import('./paginas/aspirante/MiSolicitud.jsx'));
const Notificaciones = lazy(() => import('./paginas/aspirante/Notificaciones.jsx'));

const InicioAdmin = lazy(() => import('./paginas/admin/InicioAdmin.jsx'));
const BandejaSolicitudes = lazy(() => import('./paginas/admin/BandejaSolicitudes.jsx'));
const Expediente = lazy(() => import('./paginas/admin/Expediente.jsx'));
const FormulariosPorBeca = lazy(() => import('./paginas/admin/FormulariosPorBeca.jsx'));
const FormulariosDeBeca = lazy(() => import('./paginas/admin/FormulariosDeBeca.jsx'));
const Entrevistas = lazy(() => import('./paginas/admin/Entrevistas.jsx'));
const SegundaAprobacion = lazy(() => import('./paginas/admin/SegundaAprobacion.jsx'));
const Bitacora = lazy(() => import('./paginas/admin/Bitacora.jsx'));

const Usuarios = lazy(() => import('./paginas/superadmin/Usuarios.jsx'));
const ProgramasBecas = lazy(() => import('./paginas/superadmin/ProgramasBecas.jsx'));
const Estadisticas = lazy(() => import('./paginas/superadmin/Estadisticas.jsx'));

const ADMINISTRACION = ['admin', 'superadmin'];

export default function App() {
    return (
        <Routes>
            <Route index element={<Navigate to="/panel" replace />} />
            {/* Direcciones de la versión anterior */}
            <Route path="index.html" element={<Navigate to="/acceso" replace />} />
            <Route path="dashboard.html" element={<Navigate to="/panel" replace />} />
            <Route path="Frontend/*" element={<Navigate to="/" replace />} />

            <Route element={<SoloInvitados />}>
                <Route element={<AccesoLayout />}>
                    <Route path="acceso" element={<IniciarSesion />} />
                    <Route path="registro" element={<Registro />} />
                </Route>
            </Route>

            <Route element={<RequiereSesion />}>
                <Route path="panel" element={<PanelLayout />}>
                    <Route index element={<SegunRol paginas={{ aspirante: InicioAspirante, admin: InicioAdmin, superadmin: InicioAdmin }} />} />
                    <Route path="cuenta" element={<Cuenta />} />
                    <Route path="documentos" element={<Documentos />} />

                    <Route element={<RequiereRol roles={['aspirante']} />}>
                        <Route path="becas" element={<CatalogoBecas />} />
                        <Route path="solicitud" element={<MiSolicitud />} />
                        <Route path="solicitud/formulario" element={<FormularioSolicitud />} />
                        <Route path="notificaciones" element={<Notificaciones />} />
                    </Route>

                    <Route element={<RequiereRol roles={ADMINISTRACION} />}>
                        <Route path="solicitudes" element={<BandejaSolicitudes />} />
                        <Route path="solicitudes/:usuario" element={<Expediente />} />
                        <Route path="formularios" element={<FormulariosPorBeca />} />
                        <Route path="formularios/:becaId" element={<FormulariosDeBeca />} />
                        <Route path="entrevistas" element={<Entrevistas />} />
                        <Route path="aprobaciones" element={<SegundaAprobacion />} />
                        <Route path="bitacora" element={<Bitacora />} />
                    </Route>

                    <Route element={<RequiereRol roles={['superadmin']} />}>
                        <Route path="usuarios" element={<Usuarios />} />
                        <Route path="programas" element={<ProgramasBecas />} />
                        <Route path="estadisticas" element={<Estadisticas />} />
                    </Route>

                    <Route path="*" element={<NoEncontrada />} />
                </Route>
            </Route>

            <Route path="*" element={<NoEncontrada />} />
        </Routes>
    );
}
