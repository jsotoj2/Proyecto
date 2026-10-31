import { errorUsuario } from '../compartido/errorAplicacion.js';
import { privilegio } from '../negocio/validaciones.js';
import { validarCuenta } from '../negocio/cuentas.js';
import { hashPassword } from '../infraestructura/seguridad.js';

export async function prepararUsuario(actor, accion) {
    if (accion.tipo !== 'crear-usuario') return;
    privilegio(actor, true);
    if (!['admin', 'aspirante'].includes(accion.usuario?.rol)) errorUsuario('Rol no permitido.');
    const usuario = validarCuenta(accion.usuario, accion.usuario.rol, accion.usuario.rol === 'aspirante');
    usuario.password_hash = await hashPassword(accion.usuario.password);
    return usuario;
}

export async function ejecutarUsuarios({ datos, actor, accion, registrar, transaccion, nuevoUsuario }) {
    switch (accion.tipo) {
        case 'crear-usuario':
            privilegio(actor, true);
            await transaccion.crearUsuario(nuevoUsuario);
            registrar(`${actor.nombre} creó la cuenta ${nuevoUsuario.usuario} (${nuevoUsuario.rol}).`);
            break;
        case 'activar-usuario': {
            privilegio(actor, true);
            if (typeof accion.activo !== 'boolean') errorUsuario('Estado de usuario no válido.');
            if (accion.usuario === actor.usuario) errorUsuario('No puedes desactivar tu propia cuenta.');
            const objetivo = await transaccion.buscarUsuario(accion.usuario);
            if (!objetivo) errorUsuario('Usuario inexistente.', 404);
            if (objetivo.rol === 'superadmin') errorUsuario('No se modifica otra cuenta superadministradora desde este panel.', 403);
            await transaccion.activarUsuario(objetivo.id, accion.activo);
            registrar(`${actor.nombre} ${accion.activo ? 'activó' : 'desactivó'} la cuenta ${objetivo.usuario}.`);
            break;
        }

        default: errorUsuario('Operación de usuarios no reconocida.');
    }
}
