import { UsuariosRepositorio } from './usuariosRepositorio.js';
import { errorUsuario } from '../servicios/autenticacionServicio.js';

const interpretar = valor => typeof valor === 'string' ? JSON.parse(valor) : valor;
const fecha = valor => valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);

export class PlataformaRepositorio extends UsuariosRepositorio {
    async comprobarEsquema() {
        const [filas] = await this.conexion.execute("SELECT nombre FROM migraciones WHERE nombre IN ('datos-relacionales-v1','004-integridad.sql:3')");
        if (filas.length !== 2) throw new Error('Completa npm run migrar antes de iniciar la aplicación.');
    }

    async leerEstado() {
        // La versión y los datos pertenecen a la misma instantánea transaccional.
        return this.transaccion(repositorio => repositorio.leerTablas());
    }

    async leerEstadoBloqueado() {
        await this.conexion.execute('SELECT version FROM control_plataforma WHERE id=1 FOR UPDATE');
        const estado = await this.leerTablas();
        this.estadoOriginal = structuredClone(estado.datos);
        return estado;
    }

    async leerTablas() {
        const [control] = await this.conexion.execute('SELECT version FROM control_plataforma WHERE id=1');
        const [usuarios] = await this.conexion.execute('SELECT id,usuario,nombre,correo,dpi,rol,activo FROM usuarios_app');
        const [programas] = await this.conexion.execute('SELECT * FROM programas_beca ORDER BY id');
        const [postulaciones] = await this.conexion.execute('SELECT * FROM postulaciones ORDER BY id');
        const [horarios] = await this.conexion.execute('SELECT * FROM horarios_entrevista ORDER BY fecha,hora');
        const [descargas] = await this.conexion.execute('SELECT usuario,beca_id AS becaId,fecha FROM descargas_formulario');
        const [actividad] = await this.conexion.execute('SELECT texto,fecha FROM actividad_plataforma ORDER BY id DESC LIMIT 500');
        const datos = {
            becas: programas.map(b => ({ ...b, id: Number(b.id), requisitos: interpretar(b.requisitos) })),
            horarios: horarios.map(h => ({ id: Number(h.id), fecha: fecha(h.fecha), hora: String(h.hora).slice(0, 5), modalidad: h.modalidad, ocupado: Boolean(h.usuario), usuario: h.usuario ?? '' })),
            descargas: descargas.map(d => ({ ...d, becaId: Number(d.becaId), fecha: fecha(d.fecha) })),
            actividad,
            solicitudes: postulaciones.map(s => {
                const horario = horarios.find(h => h.usuario === s.usuario);
                return {
                    id: Number(s.id), usuario: s.usuario, dpi: s.dpi, becaId: Number(s.beca_id),
                    fechaFormulario: fecha(s.fecha_formulario), formularioEnviado: true, formulario: interpretar(s.formulario),
                    fase2: { estado: s.revision, comentario: s.comentario_revision },
                    fase4: { estado: s.resultado, comentario: s.comentario_resultado },
                    entrevista: { estado: s.entrevista, fecha: horario ? fecha(horario.fecha) : '', hora: horario ? String(horario.hora).slice(0, 5) : '', modalidad: horario?.modalidad ?? '' }
                };
            })
        };
        return { datos, usuarios, version: Number(control[0].version) };
    }

    async guardarEstado(datos, version, actividadesNuevas = []) {
        const anterior = this.estadoOriginal ?? { becas: [], solicitudes: [], horarios: [], descargas: [], actividad: [] };
        const cambio = (grupo, registro, clave = 'id') => JSON.stringify(anterior[grupo].find(r => r[clave] === registro[clave])) !== JSON.stringify(registro);
        // Solo se escriben registros modificados; las reglas de negocio permanecen en el servicio.
        for (const b of datos.becas.filter(b => cambio('becas', b))) {
            await this.conexion.execute(
                'INSERT INTO programas_beca (id,nombre,descripcion,requisitos,cupos) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE nombre=?,descripcion=?,requisitos=?,cupos=?',
                [b.id,b.nombre,b.descripcion,JSON.stringify(b.requisitos),b.cupos,b.nombre,b.descripcion,JSON.stringify(b.requisitos),b.cupos]
            );
        }
        for (const s of datos.solicitudes.filter(s => cambio('solicitudes', s))) {
            const valores = [s.becaId,JSON.stringify(s.formulario),s.fase2.estado,s.fase2.comentario,s.entrevista.estado,s.fase4.estado,s.fase4.comentario];
            await this.conexion.execute(
                'INSERT INTO postulaciones (id,usuario,dpi,fecha_formulario,beca_id,formulario,revision,comentario_revision,entrevista,resultado,comentario_resultado) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE beca_id=?,formulario=?,revision=?,comentario_revision=?,entrevista=?,resultado=?,comentario_resultado=?',
                [s.id,s.usuario,s.dpi,s.fechaFormulario,...valores,...valores]
            );
        }
        for (const h of datos.horarios.filter(h => cambio('horarios', h))) {
            await this.conexion.execute(
                'INSERT INTO horarios_entrevista (id,fecha,hora,modalidad,usuario) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE usuario=?',
                [h.id,h.fecha,h.hora,h.modalidad,h.usuario || null,h.usuario || null]
            );
        }
        for (const d of datos.descargas.filter(d => !anterior.descargas.some(a => a.usuario === d.usuario && a.becaId === d.becaId))) {
            await this.conexion.execute('INSERT INTO descargas_formulario (usuario,beca_id,fecha) VALUES (?,?,?)', [d.usuario,d.becaId,d.fecha]);
        }
        // El servicio añade actividad al inicio y no reescribe el historial existente.
        const actividades = this.estadoOriginal ? actividadesNuevas : [...datos.actividad].reverse();
        for (const a of actividades) await this.conexion.execute('INSERT INTO actividad_plataforma (texto,fecha) VALUES (?,?)', [a.texto,a.fecha]);
        await this.conexion.execute('UPDATE control_plataforma SET version=? WHERE id=1', [version]);
    }

    async previas(actor) {
        const filtro = actor.rol === 'aspirante' ? ' WHERE e.cui=?' : '';
        const [filas] = await this.conexion.execute('SELECT s.expediente,s.estado,b.nombre AS beca,e.nombre AS postulante,e.cui,d.nombre AS documento FROM solicitudes s JOIN estudiantes e ON e.id=s.estudiante_id JOIN becas b ON b.id=s.beca_id LEFT JOIN documentos d ON d.expediente=s.expediente' + filtro, actor.rol === 'aspirante' ? [actor.dpi] : []);
        return filas;
    }

    async documentoPrevio(actor, expediente) {
        const [filas] = await this.conexion.execute('SELECT d.nombre,d.contenido,e.cui FROM documentos d JOIN solicitudes s ON s.expediente=d.expediente JOIN estudiantes e ON e.id=s.estudiante_id WHERE d.expediente=?', [expediente]);
        const documento = filas[0];
        return documento && (actor.rol !== 'aspirante' || documento.cui === actor.dpi) ? documento : null;
    }

    async guardarDocumento(actor, id, nombre, contenido) {
        await this.transaccion(async repositorio => {
            await repositorio.conexion.execute('SELECT version FROM control_plataforma WHERE id=1 FOR UPDATE');
            const [filas] = await repositorio.conexion.execute('SELECT usuario,revision FROM postulaciones WHERE id=?', [id]);
            const solicitud = filas[0];
            if (!solicitud || solicitud.usuario !== actor.usuario || solicitud.revision !== 'pendiente') errorUsuario('El PDF requiere una solicitud propia sin revisar.', 403);
            await repositorio.conexion.execute(
                "INSERT INTO documentos_plataforma (solicitud_id,usuario_id,nombre,tipo,contenido) VALUES (?,?,?,'application/pdf',?) ON DUPLICATE KEY UPDATE nombre=?,contenido=?",
                [id,actor.id,nombre,contenido,nombre,contenido]
            );
        });
    }

    async documento(actor, id) {
        const [filas] = await this.conexion.execute('SELECT usuario_id,nombre,contenido FROM documentos_plataforma WHERE solicitud_id=?', [id]);
        const documento = filas[0];
        return documento && (actor.rol !== 'aspirante' || Number(documento.usuario_id) === actor.id) ? documento : null;
    }

    async documentos(actor) {
        const [filas] = await this.conexion.execute('SELECT solicitud_id,nombre FROM documentos_plataforma' + (actor.rol === 'aspirante' ? ' WHERE usuario_id=?' : ''), actor.rol === 'aspirante' ? [actor.id] : []);
        return filas;
    }
}
