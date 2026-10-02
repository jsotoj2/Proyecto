function errorValidacion(mensaje, codigo = 'VALIDACION') { const error = new Error(mensaje); error.codigo = codigo; return error; }
function errorAlmacenamiento() { const error = new Error('No se pudo guardar la solicitud en MySQL.'); error.codigo = 'ALMACENAMIENTO'; return error; }
// Capa de negocio: valida datos y coordina las solicitudes, sin usar el DOM.
export class SolicitudServicio {
    constructor(repositorio, becasDisponibles) {
        this.repositorio = repositorio;
        this.becasDisponibles = new Set(becasDisponibles);
    }

    validarCui(valor) {
        const cui = String(valor ?? '').trim();
        if (!/^\d{13}$/.test(cui)) throw errorValidacion('El CUI debe contener exactamente 13 dígitos.');
        return cui;
    }

    async registrar(datos) {
        const nombre = String(datos.nombre ?? '').trim();
        const correo = String(datos.correo ?? '').trim();
        const beca = String(datos.beca ?? '').trim();
        const cui = this.validarCui(datos.cui);
        if (nombre.length < 2 || nombre.length > 160) throw errorValidacion('Ingresa tu nombre completo.');
        if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw errorValidacion('Ingresa un correo electrónico válido.');
        if (!this.becasDisponibles.has(beca)) throw errorValidacion('Selecciona una de las becas mostradas.');
        const archivo = datos.archivo;
        if (!archivo || typeof archivo.name !== 'string' || archivo.name.length > 255 || !/\.pdf$/i.test(archivo.name) || archivo.size === 0) {
            throw errorValidacion('Selecciona un archivo PDF con contenido.');
        }
        if (archivo.size > 5 * 1024 * 1024) throw errorValidacion('El PDF debe pesar como máximo 5 MB.');
        const cabecera = new TextDecoder().decode(await archivo.slice(0, 5).arrayBuffer());
        if (cabecera !== '%PDF-') throw errorValidacion('El archivo seleccionado no tiene una cabecera PDF válida.');
        const fecha = new Date();
        const solicitud = {
            expediente: `EXP-${fecha.getFullYear()}-${crypto.randomUUID().toUpperCase()}`,
            nombre, correo, cui, beca,
            estado: 'Recibida',
            fecha: fecha.toISOString(),
            documento: archivo
        };
        try {
            await this.repositorio.guardar(solicitud);
        } catch (error) {
            if (error.name === 'ConstraintError') throw errorValidacion('Ya existe una solicitud de este CUI para esta beca.', 'DUPLICADA');
            throw errorAlmacenamiento();
        }
        return this.resumen(solicitud);
    }

    async consultarPorCui(valor) {
        const solicitudes = await this.repositorio.buscarPorCui(this.validarCui(valor));
        return solicitudes.map(solicitud => this.resumen(solicitud));
    }

    async consultarPorExpediente(valor) {
        const expediente = String(valor ?? '').trim().toUpperCase();
        if (!expediente) throw errorValidacion('Ingresa un número de expediente.');
        const solicitud = await this.repositorio.buscarPorExpediente(expediente);
        return solicitud ? this.resumen(solicitud) : null;
    }

    resumen(solicitud) {
        return {
            expediente: solicitud.expediente,
            nombre: solicitud.nombre,
            cui: solicitud.cui,
            beca: solicitud.beca,
            estado: solicitud.estado,
            fecha: solicitud.fecha,
            archivoNombre: solicitud.documento.name
        };
    }
}

