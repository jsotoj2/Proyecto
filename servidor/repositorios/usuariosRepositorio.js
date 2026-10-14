export class UsuariosRepositorio {
    constructor(conexion) { this.conexion = conexion; }

    async buscarUsuario(usuario) {
        const [filas] = await this.conexion.execute('SELECT * FROM usuarios_app WHERE usuario = ?', [usuario]);
        return filas[0] ?? null;
    }

    async crearUsuario(usuario) {
        const { nombre, correo, dpi, password_hash, rol, activo } = usuario;
        const [resultado] = await this.conexion.execute(
            'INSERT INTO usuarios_app (usuario,nombre,correo,dpi,password_hash,rol,activo) VALUES (?,?,?,?,?,?,?)',
            [usuario.usuario, nombre, correo, dpi, password_hash, rol, activo]
        );
        return { ...usuario, id: Number(resultado.insertId) };
    }

    async actualizarUsuario(id, datos) {
        await this.transaccion(async repositorio => {
            await repositorio.conexion.execute(
                'UPDATE usuarios_app SET nombre=?,correo=?,password_hash=COALESCE(?,password_hash) WHERE id=?',
                [datos.nombre, datos.correo, datos.password_hash, id]
            );
            if (datos.password_hash) await repositorio.conexion.execute('DELETE FROM sesiones_app WHERE usuario_id=?', [id]);
        });
    }

    async activarUsuario(id, activo) {
        await this.conexion.execute('UPDATE usuarios_app SET activo=? WHERE id=?', [activo, id]);
        if (!activo) await this.conexion.execute('DELETE FROM sesiones_app WHERE usuario_id=?', [id]);
    }

    async crearSesion(hash, id, expira) {
        await this.conexion.execute('DELETE FROM sesiones_app WHERE expira < UTC_TIMESTAMP(3)');
        await this.conexion.execute('INSERT INTO sesiones_app (token_hash,usuario_id,expira) VALUES (?,?,?)', [hash, id, expira]);
    }

    async buscarSesion(hash) {
        const [filas] = await this.conexion.execute(
            'SELECT u.* FROM usuarios_app u JOIN sesiones_app s ON s.usuario_id=u.id WHERE s.token_hash=? AND s.expira>UTC_TIMESTAMP(3) AND u.activo=1', [hash]
        );
        return filas[0] ?? null;
    }

    async borrarSesion(hash) { await this.conexion.execute('DELETE FROM sesiones_app WHERE token_hash=?', [hash]); }

    async haySuperadmin() {
        const [filas] = await this.conexion.execute("SELECT id FROM usuarios_app WHERE rol='superadmin' AND activo=1 LIMIT 1");
        return filas.length > 0;
    }

    // Toda operación usa una única conexión; siempre se devuelve al pool.
    async transaccion(operacion) {
        const conexion = await this.conexion.getConnection();
        try {
            await conexion.beginTransaction();
            const resultado = await operacion(new this.constructor(conexion));
            await conexion.commit();
            return resultado;
        } catch (error) {
            try { await conexion.rollback(); } catch { /* Se conserva el error original. */ }
            throw error;
        } finally { conexion.release(); }
    }
}
