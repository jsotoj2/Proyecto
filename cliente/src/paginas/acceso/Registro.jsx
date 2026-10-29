import { Link, useNavigate } from 'react-router';
import { AtSign, IdCard, Lock, Mail, User } from 'lucide-react';
import { api } from '../../api/cliente.js';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { CAMPOS_CUENTA } from '../../utilidades/validaciones.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { alertaExito } from '../../componentes/alertas/alertas.js';
import Campo, { RejillaCampos } from '../../componentes/ui/Campo.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import estilos from './Acceso.module.css';

const VACIO = { nombre: '', dpi: '', correo: '', usuario: '', password: '' };

export default function Registro() {
    useTitulo('Crear cuenta');
    const { ejecutando, ejecutar } = useOperacion();
    const navegar = useNavigate();
    const { valores: datos, campo, validar } = useFormulario(VACIO, CAMPOS_CUENTA);

    async function enviar(evento) {
        evento.preventDefault();
        if (!validar()) return;
        await ejecutar(() => api('registro', { ...datos, nombre: datos.nombre.trim() }), {
            tituloError: 'No pudimos crear tu cuenta',
            exito: async () => {
                await alertaExito('Cuenta creada', 'Ya puedes iniciar sesión con tu usuario y contraseña.');
                navegar('/acceso', { replace: true, state: { usuario: datos.usuario } });
            }
        });
    }

    return (
        <>
            <header className={estilos.encabezado}>
                <h2>Crear cuenta de aspirante</h2>
                <p>Todos los campos son obligatorios.</p>
            </header>
            <form className={estilos.formulario} onSubmit={enviar} noValidate>
                <RejillaCampos>
                    <Campo etiqueta="Nombre completo" {...campo('nombre')} icono={User} autoComplete="name" maxLength={160} placeholder="Como aparece en tu DPI" completo autoFocus />
                    <Campo etiqueta="DPI / CUI" {...campo('dpi')} icono={IdCard} inputMode="numeric" maxLength={13} placeholder="13 dígitos" />
                    <Campo etiqueta="Correo electrónico" {...campo('correo')} type="email" icono={Mail} autoComplete="email" maxLength={254} placeholder="tu@correo.com" />
                    <Campo etiqueta="Usuario" {...campo('usuario')} icono={AtSign} autoComplete="username" maxLength={40} placeholder="ej. maria.lopez" />
                    <Campo etiqueta="Contraseña" {...campo('password')} type="password" icono={Lock} autoComplete="new-password" placeholder="Mín. 8 caracteres" />
                </RejillaCampos>
                <Boton type="submit" tamano="lg" bloque cargando={ejecutando}>Crear cuenta</Boton>
            </form>
            <p className={estilos.nota}>¿Ya tienes una cuenta? <Link to="/acceso">Inicia sesión</Link></p>
        </>
    );
}
