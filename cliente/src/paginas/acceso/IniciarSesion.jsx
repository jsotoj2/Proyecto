import { useLocation, useNavigate } from 'react-router';
import { Lock, User, UserPlus } from 'lucide-react';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { requerido, sinEspacios } from '../../utilidades/validaciones.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { alertaInformacion } from '../../componentes/alertas/alertas.js';
import Campo from '../../componentes/ui/Campo.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import estilos from './Acceso.module.css';

const ESQUEMA = {
    usuario: { reglas: [requerido('Escribe tu usuario.')], limpiar: sinEspacios },
    password: { reglas: [requerido('Escribe tu contraseña.')] }
};

export default function IniciarSesion() {
    useTitulo('Iniciar sesión');
    const { iniciarSesion } = useSesion();
    const { ejecutando, ejecutar } = useOperacion();
    const navegar = useNavigate();
    const { state } = useLocation();
    const { valores: credenciales, campo, validar } = useFormulario({ usuario: state?.usuario ?? '', password: '' }, ESQUEMA);

    async function enviar(evento) {
        evento.preventDefault();
        if (!validar()) return;
        await ejecutar(() => iniciarSesion(credenciales), {
            tituloError: 'No pudimos iniciar tu sesión',
            exito: () => navegar(state?.desde?.startsWith('/panel') ? state.desde : '/panel', { replace: true })
        });
    }

    // La plataforma todavía no envía correos; el restablecimiento lo hace la administración.
    const olvideContrasena = () => alertaInformacion(
        '¿Olvidaste tu contraseña?',
        'Comunícate con la administración de becas para restablecerla. Por seguridad, al cambiarla se cerrarán tus sesiones abiertas.'
    );

    return (
        <>
            <header className={estilos.encabezado}>
                <h2>Iniciar sesión</h2>
                <p>Ingresa con tu usuario y contraseña.</p>
            </header>
            <form className={estilos.formulario} onSubmit={enviar} noValidate>
                <Campo etiqueta="Usuario" {...campo('usuario')} icono={User} autoComplete="username" placeholder="Tu usuario" autoFocus />
                <Campo etiqueta="Contraseña" {...campo('password')} type="password" icono={Lock} autoComplete="current-password" placeholder="Tu contraseña" />
                <div className={estilos.filaOpciones}>
                    <button type="button" className={estilos.enlaceTexto} onClick={olvideContrasena}>¿Olvidaste tu contraseña?</button>
                </div>
                <Boton type="submit" tamano="lg" bloque cargando={ejecutando}>Iniciar sesión</Boton>
            </form>
            <div className={estilos.separador}><span>¿Aún no tienes cuenta?</span></div>
            <Boton a="/registro" variante="secundario" tamano="lg" bloque icono={UserPlus}>Crear cuenta de aspirante</Boton>
        </>
    );
}
