import { Save } from 'lucide-react';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { CAMPOS_CUENTA, contrasena } from '../../utilidades/validaciones.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { alertaExito, avisoExito, confirmar } from '../../componentes/alertas/alertas.js';
import { nombreRol } from '../../utilidades/formato.js';
import { EncabezadoPagina } from '../../componentes/ui/Pagina.jsx';
import Campo, { RejillaCampos } from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Alerta from '../../componentes/alertas/Alerta.jsx';

// La contraseña es opcional en el perfil: vacía conserva la actual.
const ESQUEMA = { nombre: CAMPOS_CUENTA.nombre, correo: CAMPOS_CUENTA.correo, password: { reglas: [contrasena] } };

export default function Cuenta() {
    useTitulo('Mi perfil');
    const { usuario, actualizarCuenta } = useSesion();
    const { ejecutando, ejecutar } = useOperacion();
    const { valores: datos, setValores, campo, validar } = useFormulario({ nombre: usuario.nombre, correo: usuario.correo, password: '' }, ESQUEMA);

    async function guardar(evento) {
        evento.preventDefault();
        if (!validar()) return;
        const cambiaContrasena = Boolean(datos.password);
        if (cambiaContrasena) {
            const aceptado = await confirmar({
                titulo: '¿Cambiar tu contraseña?',
                texto: 'Se cerrarán todas tus sesiones abiertas y deberás ingresar con la nueva contraseña.',
                textoConfirmar: 'Cambiar contraseña',
                icono: 'warning'
            });
            if (!aceptado) return;
        }
        await ejecutar(() => actualizarCuenta({ ...datos, nombre: datos.nombre.trim() }), {
            exito: () => (cambiaContrasena
                ? alertaExito('Contraseña actualizada', 'Inicia sesión nuevamente con tu nueva contraseña.')
                : avisoExito('Datos actualizados correctamente.'))
        });
        setValores(actuales => ({ ...actuales, password: '' }));
    }

    return (
        <>
            <EncabezadoPagina antetitulo="Cuenta" titulo="Mi perfil" descripcion="Mantén actualizados tus datos de contacto para recibir avisos sobre tu proceso." />
            <Tarjeta titulo="Información personal" como="form" onSubmit={guardar} noValidate>
                <div className="pila">
                    <RejillaCampos>
                        <Campo etiqueta="Nombre completo" {...campo('nombre')} maxLength={160} autoComplete="name" />
                        <Campo etiqueta="Correo electrónico" {...campo('correo')} type="email" maxLength={254} autoComplete="email" ayuda="Aquí recibirás los avisos de tu solicitud." />
                        <Campo etiqueta="Usuario" value={usuario.usuario} readOnly ayuda="El usuario no puede modificarse." />
                        <Campo etiqueta="Rol" value={nombreRol(usuario.rol)} readOnly />
                        {usuario.dpi && <Campo etiqueta="DPI / CUI" value={usuario.dpi} readOnly />}
                    </RejillaCampos>
                    <hr style={{ border: 0, borderTop: '1px solid var(--borde)', margin: 0 }} />
                    <RejillaCampos>
                        <Campo etiqueta="Nueva contraseña" {...campo('password')} type="password" autoComplete="new-password" placeholder="Déjala vacía para conservarla" opcional />
                    </RejillaCampos>
                    {datos.password && <Alerta tipo="advertencia">Al cambiar la contraseña se cerrarán todas tus sesiones.</Alerta>}
                    <div className="fila">
                        <Boton type="submit" icono={Save} cargando={ejecutando}>Guardar cambios</Boton>
                    </div>
                </div>
            </Tarjeta>
        </>
    );
}
