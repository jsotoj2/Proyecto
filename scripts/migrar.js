import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { crearConexion } from '../servidor/configuracion/conexion.js';
import { PlataformaRepositorio } from '../servidor/repositorios/plataformaRepositorio.js';

const directorio = new URL('../base-datos/', import.meta.url);

export async function migrar(conexion) {
    const exclusiva = await conexion.getConnection();
    let bloqueada = false;
    try {
        const [bloqueo] = await exclusiva.execute("SELECT GET_LOCK(CONCAT('becas:',LEFT(SHA2(DATABASE(),256),48)),10) AS adquirido");
        if (Number(bloqueo[0].adquirido) !== 1) throw new Error('Otra migración está en ejecución.');
        bloqueada = true;
        await exclusiva.query('CREATE TABLE IF NOT EXISTS migraciones (nombre VARCHAR(150) PRIMARY KEY, checksum CHAR(64) NOT NULL, aplicada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB');
        for (const archivo of ['001-historico.sql', '002-usuarios.sql', '003-plataforma-relacional.sql']) {
            await aplicarArchivo(exclusiva, archivo);
        }
        const [migrada] = await exclusiva.execute("SELECT nombre FROM migraciones WHERE nombre='datos-relacionales-v1'");
        if (!migrada.length) {
            await exclusiva.beginTransaction();
            try {
                const [anteriores] = await exclusiva.execute('SELECT datos,version FROM estado_plataforma WHERE id=1 FOR UPDATE');
                const estado = anteriores.length ? anteriores[0] : {
                    datos: JSON.parse(await fs.readFile(new URL('catalogo-inicial.json', directorio), 'utf8')), version: 0
                };
                const datos = typeof estado.datos === 'string' ? JSON.parse(estado.datos) : estado.datos;
                await new PlataformaRepositorio(exclusiva).guardarEstado(datos, Number(estado.version));
                await exclusiva.execute("INSERT INTO migraciones (nombre,checksum) VALUES ('datos-relacionales-v1',?)", [createHash('sha256').update(JSON.stringify(datos)).digest('hex')]);
                await exclusiva.commit();
            } catch (error) { await exclusiva.rollback(); throw error; }
        }
        await aplicarArchivo(exclusiva, '004-integridad.sql');
    } finally {
        try {
            if (bloqueada) await exclusiva.query("SELECT RELEASE_LOCK(CONCAT('becas:',LEFT(SHA2(DATABASE(),256),48)))");
        } finally { exclusiva.release(); }
    }
}

async function aplicarArchivo(conexion, archivo) {
    const contenido = await fs.readFile(new URL(archivo, directorio), 'utf8');
    const sentencias = contenido.replace(/^\s*--.*$/gm, '').split(';').map(sql => sql.trim()).filter(Boolean);
    // Cada sentencia se registra por separado porque MySQL confirma DDL automáticamente.
    for (const [indice, sql] of sentencias.entries()) {
        const nombre = `${archivo}:${indice + 1}`;
        const checksum = createHash('sha256').update(sql).digest('hex');
        const [aplicada] = await conexion.execute('SELECT checksum FROM migraciones WHERE nombre=?', [nombre]);
        if (aplicada.length) {
            if (aplicada[0].checksum !== checksum) throw new Error(`La migración aplicada ${nombre} fue modificada. Crea otra migración.`);
            continue;
        }
        try { await conexion.query(sql); }
        catch (error) {
            // Una caída entre DDL y su registro puede dejar el índice ya creado.
            if (!(archivo === '004-integridad.sql' && ['ER_DUP_KEYNAME', 'ER_FK_DUP_NAME'].includes(error.code))) throw error;
        }
        await conexion.execute('INSERT INTO migraciones (nombre,checksum) VALUES (?,?)', [nombre,checksum]);
    }
}

if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
    let conexion;
    try {
        conexion = crearConexion();
        await migrar(conexion);
        console.log('Migraciones aplicadas. Los registros anteriores se conservaron.');
    } catch (error) {
        console.error('No se pudo completar la migración:', error.code ?? error.message);
        console.error('La base debe existir. Revisa la documentación y los permisos del usuario de migración.');
        process.exitCode = 1;
    } finally { if (conexion) await conexion.end(); }
}
