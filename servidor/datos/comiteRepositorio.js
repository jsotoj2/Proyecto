// Este repositorio recibe la misma conexión de la transacción de la plataforma.
export class ComiteRepositorio {
    constructor(conexion) { this.conexion = conexion; }

    async asignar(becaId, tipoComite) {
        const [comites] = await this.conexion.execute('SELECT id FROM comites WHERE tipo=? ORDER BY id LIMIT 1', [tipoComite]);
        if (!comites.length) throw new Error('Falta el catálogo de comités. Ejecuta npm run migrar.');
        const comiteId = comites[0].id;
        const [existentes] = await this.conexion.execute('SELECT id FROM beca_comite WHERE beca_id=? AND comite_id=? LIMIT 1', [becaId, comiteId]);
        if (!existentes.length) await this.conexion.execute('INSERT INTO beca_comite (beca_id,comite_id) VALUES (?,?)', [becaId, comiteId]);
    }
}
