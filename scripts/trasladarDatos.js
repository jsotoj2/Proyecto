/*
 * Copia los datos de una base con el esquema anterior (usuarios_app, postulaciones, programas_beca…)
 * a la base de DB_NAME con el esquema actual. Solo lee la base de origen; la de destino debe estar vacía.
 * Uso: npm run trasladar -- becas_app
 */
import { crearConexion } from '../servidor/infraestructura/configuracion/conexion.js';
import { migrar } from './migrar.js';

const origenNombre = process.argv[2];
const destinoNombre = process.env.DB_NAME;
const json = valor => typeof valor === 'string' ? JSON.parse(valor) : valor;
// La actividad anterior guardaba la fecha como texto "d/m/aaaa"; se fija al mediodía de Guatemala (18:00 UTC).
function fechaActividad(texto) {
    const partes = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(texto).trim());
    if (!partes) return new Date();
    const [, dia, mes, anio] = partes.map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 18));
}

let origen;
let destino;
try {
    if (!origenNombre) throw new Error('Indica la base de origen: npm run trasladar -- becas_app');
    if (origenNombre === destinoNombre) throw new Error('La base de origen y la de destino (DB_NAME) deben ser distintas.');
    origen = crearConexion({ ...process.env, DB_NAME: origenNombre });
    destino = crearConexion();
    const leer = async sql => (await origen.query(sql))[0];

    await migrar(destino);
    const [[{ total }]] = await destino.query('SELECT COUNT(*) AS total FROM usuarios');
    if (Number(total) > 0) throw new Error(`La base ${destinoNombre} ya tiene usuarios. El traslado solo se hace sobre una base nueva.`);

    const usuarios = await leer('SELECT * FROM usuarios_app ORDER BY id');
    const becas = await leer('SELECT * FROM programas_beca ORDER BY id');
    const postulaciones = await leer('SELECT * FROM postulaciones ORDER BY id');
    const horarios = await leer('SELECT * FROM horarios_entrevista ORDER BY id');
    const descargas = await leer('SELECT * FROM descargas_formulario');
    const documentos = await leer('SELECT * FROM documentos_plataforma');
    const actividad = await leer('SELECT * FROM actividad_plataforma ORDER BY id');
    const tablaExiste = async tabla => (await leer(`SHOW TABLES LIKE '${tabla}'`)).length > 0;
    const auditoria = await tablaExiste('auditoria_solicitudes') ? await leer('SELECT * FROM auditoria_solicitudes ORDER BY id') : [];
    const notificaciones = await tablaExiste('notificaciones') ? await leer('SELECT * FROM notificaciones ORDER BY id') : [];
    const [[control]] = await origen.query('SELECT version FROM control_plataforma WHERE id=1');

    const idDe = new Map(usuarios.map(u => [u.usuario, Number(u.id)]));
    const solicitudDe = new Map(postulaciones.map(p => [p.usuario, Number(p.id)]));
    const omitidas = [];

    const conexion = await destino.getConnection();
    try {
        await conexion.beginTransaction();
        const escribir = (sql, valores) => conexion.execute(sql, valores);
        for (const u of usuarios) {
            await escribir('INSERT INTO usuarios (id,usuario,nombre,correo,dpi,password_hash,rol,activo) VALUES (?,?,?,?,?,?,?,?)',
                [u.id, u.usuario, u.nombre, u.correo, u.dpi, u.password_hash, u.rol, u.activo]);
        }
        // El catálogo inicial que cargó la migración se reemplaza por las becas reales.
        await escribir('DELETE FROM requisitos_beca');
        await escribir('DELETE FROM becas');
        for (const b of becas) {
            await escribir('INSERT INTO becas (id,nombre,descripcion,cupos) VALUES (?,?,?,?)', [b.id, b.nombre, b.descripcion, b.cupos]);
            for (const [indice, requisito] of json(b.requisitos).entries()) {
                await escribir('INSERT INTO requisitos_beca (beca_id,orden,texto) VALUES (?,?,?)', [b.id, indice + 1, requisito]);
            }
        }
        for (const p of postulaciones) {
            const f = json(p.formulario);
            const descarga = descargas.find(d => d.usuario === p.usuario && Number(d.beca_id) === Number(p.beca_id));
            await escribir(
                `INSERT INTO solicitudes (id,usuario_id,beca_id,edad,telefono,direccion,estudios,promedio,monto,motivo,fecha_envio,constancia_descargada_en,
                    revision,comentario_revision,entrevista,resultado,comentario_resultado,aprobado_por)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [p.id, idDe.get(p.usuario), p.beca_id, Number(f.edad), f.telefono, f.direccion, f.estudios, Number(f.promedio),
                    f.monto ? Number(f.monto) : null, f.motivo, p.fecha_formulario, descarga?.fecha ?? null,
                    p.revision, p.comentario_revision, p.entrevista, p.resultado, p.comentario_resultado, idDe.get(p.aprobado_por) ?? null]
            );
        }
        for (const d of descargas) if (solicitudDe.get(d.usuario) === undefined) omitidas.push(`descarga de ${d.usuario} sin solicitud`);
        for (const h of horarios) {
            await escribir('INSERT INTO horarios_entrevista (id,fecha,hora,modalidad,solicitud_id) VALUES (?,?,?,?,?)',
                [h.id, h.fecha, h.hora, h.modalidad, h.usuario ? solicitudDe.get(h.usuario) ?? null : null]);
        }
        for (const d of documentos) {
            await escribir('INSERT INTO documentos (solicitud_id,nombre,tipo,contenido) VALUES (?,?,?,?)', [d.solicitud_id, d.nombre, d.tipo, d.contenido]);
        }
        // La actividad y la auditoría anteriores se unen en la bitácora, en orden cronológico.
        const eventos = [
            ...actividad.map(a => ({ fecha: fechaActividad(a.fecha), actor_id: null, actor_usuario: 'historial', actor_rol: null, operacion: 'historial',
                solicitud_id: null, usuario_solicitud: null, estado_anterior: null, estado_nuevo: null, resultado: 'exito', descripcion: a.texto, detalle: '' })),
            ...auditoria.map(a => ({ ...a, descripcion: '', fecha: a.fecha instanceof Date ? a.fecha : new Date(String(a.fecha).replace(' ', 'T') + 'Z') }))
        ].sort((a, b) => a.fecha - b.fecha);
        for (const e of eventos) {
            await escribir(
                `INSERT INTO bitacora (fecha,actor_id,actor_usuario,actor_rol,operacion,solicitud_id,usuario_solicitud,estado_anterior,estado_nuevo,resultado,descripcion,detalle)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [e.fecha, e.actor_id, e.actor_usuario, e.actor_rol, e.operacion, e.solicitud_id, e.usuario_solicitud, e.estado_anterior, e.estado_nuevo, e.resultado, e.descripcion, e.detalle]
            );
        }
        for (const n of notificaciones) {
            await escribir('INSERT INTO notificaciones (usuario_id,solicitud_id,mensaje,leida,fecha) VALUES (?,?,?,?,?)',
                [idDe.get(n.usuario), n.solicitud_id, n.mensaje, n.leida, n.fecha]);
        }
        await escribir('UPDATE control_plataforma SET version=? WHERE id=1', [control.version]);
        await conexion.commit();
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally { conexion.release(); }

    const contar = async tabla => Number((await destino.query(`SELECT COUNT(*) AS n FROM ${tabla}`))[0][0].n);
    console.log(`Datos copiados de ${origenNombre} a ${destinoNombre}:`);
    console.log(`  usuarios ${await contar('usuarios')}/${usuarios.length} · becas ${await contar('becas')}/${becas.length} · solicitudes ${await contar('solicitudes')}/${postulaciones.length}`);
    console.log(`  horarios ${await contar('horarios_entrevista')}/${horarios.length} · documentos ${await contar('documentos')}/${documentos.length} · bitácora ${await contar('bitacora')}/${actividad.length + auditoria.length} · notificaciones ${await contar('notificaciones')}/${notificaciones.length}`);
    console.log(`  constancias descargadas ${(await destino.query('SELECT COUNT(*) AS n FROM solicitudes WHERE constancia_descargada_en IS NOT NULL'))[0][0].n}/${descargas.length}`);
    if (omitidas.length) console.log('  Sin trasladar:', omitidas.join('; '));
    console.log(`La base ${origenNombre} no se modificó. Las sesiones no se copian: cada usuario vuelve a iniciar sesión.`);
} catch (error) {
    console.error('No se pudo trasladar:', error.code ? `${error.code} – ${error.sqlMessage ?? error.message}` : error.message);
    process.exitCode = 1;
} finally {
    await origen?.end();
    await destino?.end();
}
