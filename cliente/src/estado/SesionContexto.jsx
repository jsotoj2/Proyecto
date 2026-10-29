import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, configurarSesionCaducada } from '../api/cliente.js';
import { alertaAdvertencia } from '../componentes/alertas/alertas.js';
import { almacen } from './almacen.js';

const SesionContexto = createContext(null);

export function SesionProveedor({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [verificando, setVerificando] = useState(true);
    const usuarioActual = useRef(null);

    const establecer = useCallback(nuevo => {
        usuarioActual.current = nuevo;
        if (!nuevo) almacen.limpiar();
        setUsuario(nuevo);
    }, []);

    useEffect(() => {
        api('sesion')
            .then(({ usuario: activo }) => establecer(activo))
            .catch(() => establecer(null))
            .finally(() => setVerificando(false));
    }, [establecer]);

    useEffect(() => {
        configurarSesionCaducada(() => {
            if (!usuarioActual.current) return;
            establecer(null);
            alertaAdvertencia('Tu sesión terminó', 'Por seguridad, inicia sesión nuevamente para continuar.');
        });
        return () => configurarSesionCaducada(null);
    }, [establecer]);

    const iniciarSesion = useCallback(async credenciales => {
        const { usuario: activo } = await api('login', credenciales);
        establecer(activo);
        return activo;
    }, [establecer]);

    const cerrarSesion = useCallback(async () => {
        await api('logout', {});
        establecer(null);
    }, [establecer]);

    // Cambiar la contraseña revoca todas las sesiones; en ese caso se vuelve al acceso.
    const actualizarCuenta = useCallback(async datos => {
        const { usuario: actualizado } = await api('cuenta', datos, 'PATCH');
        establecer(datos.password ? null : actualizado);
        return actualizado;
    }, [establecer]);

    const valor = useMemo(
        () => ({ usuario, verificando, iniciarSesion, cerrarSesion, actualizarCuenta }),
        [usuario, verificando, iniciarSesion, cerrarSesion, actualizarCuenta]
    );
    return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion() {
    const contexto = useContext(SesionContexto);
    if (!contexto) throw new Error('useSesion debe usarse dentro de SesionProveedor.');
    return contexto;
}
