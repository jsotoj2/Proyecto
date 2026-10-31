import { errorUsuario } from '../compartido/errorAplicacion.js';
import { texto } from './cuentas.js';
import { numero, privilegio, buscarBeca } from './validaciones.js';
import { cuposOcupados } from './solicitudesReglas.js';

export function validarAsignacionComite(datos, actor, accion) {
    privilegio(actor, true);
    const beca = buscarBeca(datos, accion.becaId);
    if (!['academico', 'financiero', 'social', 'umg'].includes(accion.tipoComite)) errorUsuario('Tipo de comité no válido.');
    return beca;
}

export function ejecutarBecas({ datos, actor, accion, registrar }) {
    switch (accion.tipo) {
        case 'crear-beca': {
            privilegio(actor, true);
            const nombre = texto(accion.nombre, 'Nombre de la beca', 160, 3);
            const descripcion = texto(accion.descripcion, 'Descripción', 3000, 10);
            const cupos = numero(accion.cupos, 'Cupos', 0, 100000, true);
            if (!Array.isArray(accion.requisitos) || !accion.requisitos.length || accion.requisitos.length > 30) errorUsuario('Incluye entre 1 y 30 requisitos.');
            const requisitos = accion.requisitos.map(requisito => texto(requisito, 'Requisito', 500));
            const normalizar = valor => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
            if (datos.becas.some(beca => normalizar(beca.nombre) === normalizar(nombre))) errorUsuario('Ya existe una beca con ese nombre.', 409);
            // La versión y el bloqueo transaccional evitan identificadores duplicados.
            const id = Math.max(0, ...datos.becas.map(beca => beca.id)) + 1;
            datos.becas.push({ id, nombre, descripcion, requisitos, cupos });
            registrar(`${actor.nombre} creó la beca ${nombre} con ${cupos} cupos.`);
            break;
        }
        case 'cupos': {
            privilegio(actor, true);
            const beca = buscarBeca(datos, accion.becaId);
            const cupos = numero(accion.cupos, 'Cupos', 0, 100000, true);
            if (cupos < cuposOcupados(datos, beca.id)) errorUsuario('Los cupos no pueden ser menores que las becas otorgadas o en segunda aprobación.');
            beca.cupos = cupos;
            registrar(`${actor.nombre} cambió los cupos de ${beca.nombre} a ${cupos}.`);
            break;
        }

        default: errorUsuario('Operación de becas no reconocida.');
    }
}
