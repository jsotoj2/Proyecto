import { errorUsuario } from '../compartido/errorAplicacion.js';
import { validarPdf, exigirSolicitudEditable, puedeConsultarDocumento } from '../negocio/documentosReglas.js';

export class DocumentosServicio {
    constructor(repositorio) { this.repositorio = repositorio; }

    async listar(actor) {
        return this.repositorio.documentos(actor.rol === 'aspirante' ? actor.id : null);
    }

    async obtener(actor, id) {
        const documento = await this.repositorio.documento(id);
        if (!puedeConsultarDocumento(actor, documento)) return null;
        return { nombre: documento.nombre, contenido: documento.contenido };
    }

    async guardar(actor, id, nombre, contenido) {
        nombre = validarPdf(actor, nombre, contenido);
        await this.repositorio.transaccion(async transaccion => {
            const usuario = await transaccion.buscarUsuario(actor.usuario);
            if (!usuario?.activo || usuario.rol !== 'aspirante' || Number(usuario.id) !== actor.id) errorUsuario('La sesión ya no permite adjuntar documentos.', 403);
            const solicitud = await transaccion.buscarSolicitudDocumento(id, true);
            exigirSolicitudEditable(actor, solicitud);
            await transaccion.guardarDocumento(id, nombre, contenido);
        });
    }
}
