export const aspirante = { id: 1, usuario: 'ana', nombre: 'Ana Pérez', correo: 'ana@example.test', dpi: '1234567890123', rol: 'aspirante', activo: true };
export const administrador = { id: 2, usuario: 'admin', nombre: 'Administración', correo: 'admin@example.test', dpi: '', rol: 'admin', activo: true };
export const superior = { ...administrador, id: 3, usuario: 'super', rol: 'superadmin' };
export const formulario = { edad: '20', promedio: '85', telefono: '55555555', direccion: 'Guatemala', estudios: 'Bachillerato', motivo: 'Continuar mis estudios' };

export class RepositorioPrueba {
    constructor() {
        this.datos = { becas: [{ id: 1, nombre: 'Ingeniería', descripcion: 'Programa de apoyo', requisitos: [], cupos: 1 }], solicitudes: [], horarios: [], descargas: [], actividad: [] };
        this.usuarios = structuredClone([aspirante, administrador, superior]);
        this.version = 0;
        this.sesiones = new Map();
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
    async documentos() { return []; }
    async previas() { return []; }
    async documento() { return null; }
    async transaccion(operacion) {
        const respaldo = await this.leerEstado();
        try { return await operacion(this); }
        catch (error) { this.datos = respaldo.datos; this.usuarios = respaldo.usuarios; this.version = respaldo.version; throw error; }
    }
}
