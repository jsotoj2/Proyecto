export const aspirante = { id: 1, usuario: 'ana', nombre: 'Ana Pérez', correo: 'ana@example.test', dpi: '1234567890123', rol: 'aspirante', activo: true };
export const administrador = { id: 2, usuario: 'admin', nombre: 'Administración', correo: 'admin@example.test', dpi: '', rol: 'admin', activo: true };
export const superior = { ...administrador, id: 3, usuario: 'super', rol: 'superadmin' };
export const formulario = { edad: '20', promedio: '85', monto: '5000', telefono: '55555555', direccion: 'Guatemala', estudios: 'Bachillerato', motivo: 'Continuar mis estudios' };

export class RepositorioPrueba {
    constructor() {
        this.datos = { becas: [{ id: 1, nombre: 'Ingeniería', descripcion: 'Programa de apoyo', requisitos: [], cupos: 1 }], solicitudes: [], horarios: [], descargas: [], actividad: [] };
        this.usuarios = structuredClone([aspirante, administrador, superior]);
        this.version = 0;
        this.sesiones = new Map();
        this.bitacora = [];
        this.avisos = [];
        this.correos = [];
    }
    async leerEstado() { return structuredClone({ datos: this.datos, usuarios: this.usuarios, version: this.version }); }
    async leerEstadoBloqueado() { return this.leerEstado(); }
    async buscarUsuario(nombre) { return this.usuarios.find(u => u.usuario === nombre); }
    async guardarEstado(datos, version) { this.datos = structuredClone(datos); this.version = version; }
    async crearUsuario(datos) { const usuario = { ...datos, id: this.usuarios.length + 1 }; this.usuarios.push(usuario); return usuario; }
    async activarUsuario(id, activo) { this.usuarios.find(u => u.id === id).activo = activo; }
    async crearSesion(hash, id) { this.sesiones.set(hash, id); }
    async buscarSesion(hash) { return this.usuarios.find(u => u.id === this.sesiones.get(hash) && u.activo); }
    async borrarSesion(hash) { this.sesiones.delete(hash); }
    async registrarAuditoria(eventos) { this.bitacora.unshift(...structuredClone(eventos).reverse()); }
    async auditoria() { return structuredClone(this.bitacora); }
    async crearNotificaciones(lista) { for (const n of lista) this.avisos.unshift({ ...n, id: this.avisos.length + 1, leida: false }); }
    async notificaciones(usuario) { return structuredClone(this.avisos.filter(n => n.usuario === usuario)); }
    async marcarNotificacionesLeidas(usuario) { for (const n of this.avisos) if (n.usuario === usuario) n.leida = true; }
    async encolarCorreos(lista) { for (const c of lista) this.correos.push({ ...c, id: this.correos.length + 1, estado: 'pendiente', intentos: 0, disponible: 0 }); }
    async reclamarCorreos(limite = 20, maxIntentos = 5) {
        const listos = this.correos.filter(c => c.estado === 'pendiente' && c.intentos < maxIntentos && c.disponible <= Date.now()).slice(0, limite);
        for (const c of listos) Object.assign(c, { estado: 'enviando', intentos: c.intentos + 1 });
        return structuredClone(listos);
    }
    async marcarCorreoEnviado(id) { Object.assign(this.correos.find(c => c.id === id), { estado: 'enviado', ultimoError: null }); }
    async marcarCorreoFallido(id, error, { definitivo, esperaSegundos }) {
        Object.assign(this.correos.find(c => c.id === id), { estado: definitivo ? 'fallido' : 'pendiente', ultimoError: String(error), disponible: Date.now() + esperaSegundos * 1000 });
    }
    async documentos() { return []; }
    async documento() { return null; }
    async transaccion(operacion) {
        const respaldo = { ...await this.leerEstado(), bitacora: structuredClone(this.bitacora), avisos: structuredClone(this.avisos), correos: structuredClone(this.correos) };
        try { return await operacion(this); }
        catch (error) { Object.assign(this, { datos: respaldo.datos, usuarios: respaldo.usuarios, version: respaldo.version, bitacora: respaldo.bitacora, avisos: respaldo.avisos, correos: respaldo.correos }); throw error; }
    }
}
