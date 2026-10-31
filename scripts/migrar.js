import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { crearConexion } from '../servidor/infraestructura/configuracion/conexion.js';

const directorio = new URL('../base-datos/', import.meta.url);
const ARCHIVOS_MIGRACION = ['001-usuarios.sql', '002-becas.sql', '003-solicitudes.sql', '004-seguimiento.sql', '005-comites.sql'];

export async function migrar(conexion) {
    const exclusiva = await conexion.getConnection();
    let bloqueada = false;
    try {
        const [bloqueo] = await exclusiva.execute("SELECT GET_LOCK(CONCAT('becas:',LEFT(SHA2(DATABASE(),256),48)),10) AS adquirido");
        if (Number(bloqueo[0].adquirido) !== 1) throw new Error('Otra migración está en ejecución.');
        bloqueada = true;
        await exclusiva.query('CREATE TABLE IF NOT EXISTS migraciones (nombre VARCHAR(150) PRIMARY KEY, checksum CHAR(64) NOT NULL, aplicada DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB');
        for (const archivo of ARCHIVOS_MIGRACION) await aplicarArchivo(exclusiva, archivo);
        await cargarCatalogoInicial(exclusiva);
    } finally {
        try {
            if (bloqueada) await exclusiva.query("SELECT RELEASE_LOCK(CONCAT('becas:',LEFT(SHA2(DATABASE(),256),48)))");
        } finally { exclusiva.release(); }
    }
}

// Una base nueva arranca con las becas de catalogo-inicial.json; nunca se vuelve a cargar.
async function cargarCatalogoInicial(conexion) {
    const [cargado] = await conexion.execute("SELECT nombre FROM migraciones WHERE nombre='catalogo-inicial'");
    if (cargado.length) return;
    await conexion.beginTransaction();
    try {
        const [becas] = await conexion.execute('SELECT COUNT(*) AS total FROM becas');
        const contenido = await fs.readFile(new URL('catalogo-inicial.json', directorio), 'utf8');
        if (Number(becas[0].total) === 0) {
            for (const beca of JSON.parse(contenido).becas) {
                await conexion.execute('INSERT INTO becas (id,nombre,descripcion,cupos) VALUES (?,?,?,?)', [beca.id, beca.nombre, beca.descripcion, beca.cupos]);
                for (const [indice, requisito] of beca.requisitos.entries()) {
                    await conexion.execute('INSERT INTO requisitos_beca (beca_id,orden,texto) VALUES (?,?,?)', [beca.id, indice + 1, requisito]);
                }
            }
        }
        await conexion.execute("INSERT INTO migraciones (nombre,checksum) VALUES ('catalogo-inicial',?)", [createHash('sha256').update(contenido).digest('hex')]);
        await conexion.commit();
    } catch (error) { await conexion.rollback(); throw error; }
}

async function aplicarArchivo(conexion, archivo) {
    // Los saltos de línea se normalizan para que una copia en Windows (CRLF) y otra en macOS (LF) den el mismo checksum.
    const contenido = (await fs.readFile(new URL(archivo, directorio), 'utf8')).replace(/\r\n/g, '\n');
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
        await conexion.query(sql);
        await conexion.execute('INSERT INTO migraciones (nombre,checksum) VALUES (?,?)', [nombre, checksum]);
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
