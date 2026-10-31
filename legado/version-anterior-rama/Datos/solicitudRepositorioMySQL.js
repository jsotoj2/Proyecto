// Acceso a datos: usa MySQL mediante un pool recibido por el constructor.
export class SolicitudRepositorioMySQL {
    constructor(pool) { this.pool = pool; }

    async guardar(solicitud) {
        const contenido = Buffer.from(await solicitud.documento.arrayBuffer());
        const conexion = await this.pool.getConnection();
        try {
            await conexion.beginTransaction();
            const [becas] = await conexion.execute('SELECT id FROM becas WHERE nombre = ? AND activa = 1', [solicitud.beca]);
            if (!becas.length) throw new Error('La beca seleccionada no está disponible.');
            await conexion.execute(
                'INSERT INTO estudiantes (cui, nombre, correo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE nombre = ?, correo = ?',
                [solicitud.cui, solicitud.nombre, solicitud.correo, solicitud.nombre, solicitud.correo]
            );
            const [estudiantes] = await conexion.execute('SELECT id FROM estudiantes WHERE cui = ?', [solicitud.cui]);
            await conexion.execute(
                'INSERT INTO solicitudes (expediente, estudiante_id, beca_id, estado, fecha) VALUES (?, ?, ?, ?, ?)',
                [solicitud.expediente, estudiantes[0].id, becas[0].id, solicitud.estado, new Date(solicitud.fecha)]
            );
            await conexion.execute(
                'INSERT INTO documentos (expediente, nombre, tipo, contenido) VALUES (?, ?, ?, ?)',
                [solicitud.expediente, solicitud.documento.name, 'application/pdf', contenido]
            );
            await conexion.commit();
        } catch (error) {
            await conexion.rollback();
            if (error.code === 'ER_DUP_ENTRY') error.name = 'ConstraintError';
            throw error;
        } finally { conexion.release(); }
    }

    async consultar(condicion, valor) {
        const [filas] = await this.pool.execute(
            `SELECT s.expediente, e.nombre, e.cui, b.nombre AS beca, s.estado, s.fecha, d.nombre AS archivo_nombre
             FROM solicitudes s
             JOIN estudiantes e ON e.id = s.estudiante_id
             JOIN becas b ON b.id = s.beca_id
             JOIN documentos d ON d.expediente = s.expediente
             WHERE ${condicion} ORDER BY s.fecha DESC`, [valor]
        );
        return filas.map(fila => ({
            expediente: fila.expediente, nombre: fila.nombre, cui: fila.cui,
            beca: fila.beca, estado: fila.estado, fecha: new Date(fila.fecha).toISOString(),
            documento: { name: fila.archivo_nombre }
        }));
    }

    async buscarPorExpediente(expediente) {
        return (await this.consultar('s.expediente = ?', expediente))[0] || null;
    }

    buscarPorCui(cui) { return this.consultar('e.cui = ?', cui); }
}
