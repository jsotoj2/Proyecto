import { UsuariosRepositorio } from './usuariosRepositorio.js';
import { errorUsuario } from '../servicios/autenticacionServicio.js';

const fecha = valor => valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
const hora = valor => String(valor).slice(0, 5);
// Las marcas de tiempo se guardan en UTC y se devuelven en ISO para que el navegador las convierta.
const instante = valor => (valor instanceof Date ? valor : new Date(String(valor).replace(' ', 'T') + 'Z'));
// DECIMAL llega como texto ("85.50"); el servicio trabaja con el número escrito sin ceros sobrantes ("85.5").
const decimal = valor => String(Number(valor));
const diaGuatemala = valor => instante(valor).toLocaleDateString('es-GT', { timeZone: 'America/Guatemala' });

/*
 * Traduce entre las tablas relacionales y el objeto de estado que usa el servicio
 * ({ becas, solicitudes, horarios, descargas, actividad }). Las relaciones se guardan por id;
 * el servicio sigue identificando a cada aspirante por su nombre de usuario.
 */
export class PlataformaRepositorio extends UsuariosRepositorio {
    async comprobarEsquema() {
        const requeridas = ['001-usuarios.sql:2', '002-becas.sql:2', '003-solicitudes.sql:3', '004-seguimiento.sql:5', 'catalogo-inicial'];
        const [filas] = await this.conexion.query('SELECT nombre FROM migraciones WHERE nombre IN (?)', [requeridas]);
        if (filas.length !== requeridas.length) throw new Error('Completa npm run migrar antes de iniciar la aplicación.');
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
        const [usuarios] = await this.conexion.execute('SELECT id,usuario,nombre,correo,dpi,rol,activo FROM usuarios');
        const [becas] = await this.conexion.execute('SELECT id,nombre,descripcion,cupos FROM becas ORDER BY id');
        const [requisitos] = await this.conexion.execute('SELECT beca_id,texto FROM requisitos_beca ORDER BY beca_id,orden');
        const [solicitudes] = await this.conexion.execute(
            `SELECT s.*, u.usuario, u.nombre, u.dpi, r.usuario AS revisor, a.usuario AS aprobador, g.usuario AS segundo,
                    h.fecha AS entrevista_fecha, h.hora AS entrevista_hora, h.modalidad AS entrevista_modalidad
             FROM solicitudes s
             JOIN usuarios u ON u.id = s.usuario_id
             LEFT JOIN usuarios r ON r.id = s.revisado_por
             LEFT JOIN usuarios a ON a.id = s.aprobado_por
             LEFT JOIN usuarios g ON g.id = s.segundo_aprobador
             LEFT JOIN horarios_entrevista h ON h.solicitud_id = s.id
             ORDER BY s.id`
        );
        const [horarios] = await this.conexion.execute(
            `SELECT h.id, h.fecha, h.hora, h.modalidad, u.usuario
             FROM horarios_entrevista h
             LEFT JOIN solicitudes s ON s.id = h.solicitud_id
             LEFT JOIN usuarios u ON u.id = s.usuario_id
             ORDER BY h.fecha, h.hora`
        );
        const [actividad] = await this.conexion.execute("SELECT descripcion,fecha FROM bitacora WHERE resultado='exito' AND descripcion<>'' ORDER BY id DESC LIMIT 500");
        const datos = {
            becas: becas.map(b => ({
                id: Number(b.id), nombre: b.nombre, descripcion: b.descripcion,
                requisitos: requisitos.filter(r => Number(r.beca_id) === Number(b.id)).map(r => r.texto),
                cupos: Number(b.cupos)
            })),
            horarios: horarios.map(h => ({ id: Number(h.id), fecha: fecha(h.fecha), hora: hora(h.hora), modalidad: h.modalidad, ocupado: Boolean(h.usuario), usuario: h.usuario ?? '' })),
            descargas: solicitudes.filter(s => s.constancia_descargada_en).map(s => ({ usuario: s.usuario, becaId: Number(s.beca_id), fecha: fecha(s.constancia_descargada_en) })),
            actividad: actividad.map(a => ({ texto: a.descripcion, fecha: diaGuatemala(a.fecha) })),
            solicitudes: solicitudes.map(s => ({
                id: Number(s.id), usuario: s.usuario, dpi: s.dpi, becaId: Number(s.beca_id),
                fechaFormulario: fecha(s.fecha_envio), formularioEnviado: true,
                formulario: {
                    nombre: s.nombre, edad: String(s.edad), promedio: decimal(s.promedio),
                    ...(s.monto === null ? {} : { monto: decimal(s.monto) }),
                    telefono: s.telefono, direccion: s.direccion, estudios: s.estudios, motivo: s.motivo
                },
                fase2: { estado: s.revision, comentario: s.comentario_revision, revisadoPor: s.revisor ?? '' },
                entrevista: {
                    estado: s.entrevista,
                    fecha: s.entrevista_fecha ? fecha(s.entrevista_fecha) : '',
                    hora: s.entrevista_hora ? hora(s.entrevista_hora) : '',
                    modalidad: s.entrevista_modalidad ?? ''
                },
                fase4: { estado: s.resultado, comentario: s.comentario_resultado, aprobadoPor: s.aprobador ?? '', segundoAprobador: s.segundo ?? '' }
            }))
        };
        return { datos, usuarios, version: Number(control[0].version) };
    }

    // Convierte nombres de usuario en ids dentro de la misma transacción.
    async idUsuario(usuario) {
        if (!usuario) return null;
        const [filas] = await this.conexion.execute('SELECT id FROM usuarios WHERE usuario=?', [usuario]);
        if (!filas.length) throw new Error(`Usuario inexistente: ${usuario}`);
        return Number(filas[0].id);
    }

    async idSolicitudDe(usuario) {
        if (!usuario) return null;
        const [filas] = await this.conexion.execute('SELECT s.id FROM solicitudes s JOIN usuarios u ON u.id=s.usuario_id WHERE u.usuario=?', [usuario]);
        return filas.length ? Number(filas[0].id) : null;
    }

    async guardarEstado(datos, version) {
        const anterior = this.estadoOriginal ?? { becas: [], solicitudes: [], horarios: [], descargas: [] };
        const cambio = (grupo, registro) => JSON.stringify(anterior[grupo].find(r => r.id === registro.id)) !== JSON.stringify(registro);
        // Solo se escriben registros modificados; las reglas de negocio permanecen en el servicio.
        for (const b of datos.becas.filter(b => cambio('becas', b))) {
            await this.conexion.execute(
                'INSERT INTO becas (id,nombre,descripcion,cupos) VALUES (?,?,?,?) AS nueva ON DUPLICATE KEY UPDATE nombre=nueva.nombre,descripcion=nueva.descripcion,cupos=nueva.cupos',
                [b.id, b.nombre, b.descripcion, b.cupos]
            );
            await this.conexion.execute('DELETE FROM requisitos_beca WHERE beca_id=?', [b.id]);
            for (const [indice, requisito] of b.requisitos.entries()) {
                await this.conexion.execute('INSERT INTO requisitos_beca (beca_id,orden,texto) VALUES (?,?,?)', [b.id, indice + 1, requisito]);
            }
        }
        for (const s of datos.solicitudes.filter(s => cambio('solicitudes', s))) {
            const f = s.formulario;
            await this.conexion.execute(
                `INSERT INTO solicitudes (id,usuario_id,beca_id,edad,telefono,direccion,estudios,promedio,monto,motivo,fecha_envio,
                    revision,comentario_revision,revisado_por,entrevista,resultado,comentario_resultado,aprobado_por,segundo_aprobador)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) AS nueva
                 ON DUPLICATE KEY UPDATE beca_id=nueva.beca_id, edad=nueva.edad, telefono=nueva.telefono, direccion=nueva.direccion,
                    estudios=nueva.estudios, promedio=nueva.promedio, monto=nueva.monto, motivo=nueva.motivo,
                    revision=nueva.revision, comentario_revision=nueva.comentario_revision, revisado_por=nueva.revisado_por,
                    entrevista=nueva.entrevista, resultado=nueva.resultado, comentario_resultado=nueva.comentario_resultado,
                    aprobado_por=nueva.aprobado_por, segundo_aprobador=nueva.segundo_aprobador`,
                [
                    s.id, await this.idUsuario(s.usuario), s.becaId, f.edad, f.telefono, f.direccion, f.estudios, f.promedio, f.monto ?? null, f.motivo, s.fechaFormulario,
                    s.fase2.estado, s.fase2.comentario, await this.idUsuario(s.fase2.revisadoPor),
                    s.entrevista.estado, s.fase4.estado, s.fase4.comentario, await this.idUsuario(s.fase4.aprobadoPor), await this.idUsuario(s.fase4.segundoAprobador)
                ]
            );
        }
        for (const h of datos.horarios.filter(h => cambio('horarios', h))) {
            await this.conexion.execute(
                'INSERT INTO horarios_entrevista (id,fecha,hora,modalidad,solicitud_id) VALUES (?,?,?,?,?) AS nuevo ON DUPLICATE KEY UPDATE solicitud_id=nuevo.solicitud_id',
                [h.id, h.fecha, h.hora, h.modalidad, await this.idSolicitudDe(h.usuario)]
            );
        }
        for (const d of datos.descargas.filter(d => !anterior.descargas.some(a => a.usuario === d.usuario && a.becaId === d.becaId))) {
            await this.conexion.execute(
                'UPDATE solicitudes SET constancia_descargada_en=? WHERE usuario_id=? AND beca_id=? AND constancia_descargada_en IS NULL',
                [d.fecha, await this.idUsuario(d.usuario), d.becaId]
            );
        }
        await this.conexion.execute('UPDATE control_plataforma SET version=? WHERE id=1', [version]);
    }

    async registrarAuditoria(eventos) {
        for (const e of eventos) {
            await this.conexion.execute(
                `INSERT INTO bitacora (fecha,actor_id,actor_usuario,actor_rol,operacion,solicitud_id,usuario_solicitud,estado_anterior,estado_nuevo,resultado,descripcion,detalle)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                [new Date(e.fecha), e.actorId, e.actorUsuario, e.actorRol, e.operacion, e.solicitudId ?? null, e.usuarioSolicitud ?? null,
                    e.estadoAnterior ?? null, e.estadoNuevo ?? null, e.resultado, (e.descripcion ?? '').slice(0, 1000), (e.detalle ?? '').slice(0, 2000)]
            );
        }
    }

    async auditoria(limite = 500) {
        const [filas] = await this.conexion.execute(`SELECT * FROM bitacora ORDER BY id DESC LIMIT ${Number(limite)}`);
        return filas.map(f => ({
            id: Number(f.id), solicitudId: f.solicitud_id === null ? null : Number(f.solicitud_id), usuarioSolicitud: f.usuario_solicitud ?? '',
            actorId: f.actor_id === null ? null : Number(f.actor_id), actorUsuario: f.actor_usuario, actorRol: f.actor_rol ?? '', operacion: f.operacion,
            estadoAnterior: f.estado_anterior ?? '', estadoNuevo: f.estado_nuevo ?? '', resultado: f.resultado,
            detalle: f.detalle || f.descripcion, fecha: instante(f.fecha).toISOString()
        }));
    }

    async crearNotificaciones(notificaciones) {
        for (const n of notificaciones) {
            await this.conexion.execute(
                'INSERT INTO notificaciones (usuario_id,solicitud_id,mensaje,fecha) SELECT id,?,?,? FROM usuarios WHERE usuario=?',
                [n.solicitudId, n.mensaje, new Date(n.fecha), n.usuario]
            );
        }
    }

    // Bandeja de salida de correos. Se escribe dentro de la transacción del cambio de etapa.
    async encolarCorreos(correos) {
        for (const c of correos) {
            await this.conexion.execute(
                `INSERT INTO correos_salientes (usuario_id,destinatario,asunto,texto,html,creado_en,disponible_desde,actualizado_en)
                 VALUES (?,?,?,?,?,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))`,
                [c.usuario ? await this.idUsuario(c.usuario) : null, c.destinatario, c.asunto.slice(0, 200), c.texto, c.html]
            );
        }
    }

    // Reserva correos listos para enviar. SKIP LOCKED evita que dos procesos tomen el mismo correo;
    // los que quedaron "enviando" por una caída se recuperan después de 10 minutos.
    async reclamarCorreos(limite = 20, maxIntentos = 5) {
        return this.transaccion(async repositorio => {
            const [filas] = await repositorio.conexion.execute(
                `SELECT id,destinatario,asunto,texto,html,intentos FROM correos_salientes
                 WHERE intentos < ? AND ((estado='pendiente' AND disponible_desde <= UTC_TIMESTAMP(3))
                    OR (estado='enviando' AND actualizado_en < UTC_TIMESTAMP(3) - INTERVAL 10 MINUTE))
                 ORDER BY id LIMIT ${Number(limite)} FOR UPDATE SKIP LOCKED`,
                [maxIntentos]
            );
            if (filas.length) {
                await repositorio.conexion.query("UPDATE correos_salientes SET estado='enviando', intentos=intentos+1, actualizado_en=UTC_TIMESTAMP(3) WHERE id IN (?)", [filas.map(f => f.id)]);
            }
            return filas.map(f => ({ ...f, id: Number(f.id), intentos: Number(f.intentos) + 1 }));
        });
    }

    async marcarCorreoEnviado(id) {
        await this.conexion.execute("UPDATE correos_salientes SET estado='enviado', enviado_en=UTC_TIMESTAMP(3), actualizado_en=UTC_TIMESTAMP(3), ultimo_error=NULL WHERE id=?", [id]);
    }

    // Un fallo temporal vuelve a la cola tras la espera indicada; al agotar los intentos queda como fallido.
    async marcarCorreoFallido(id, error, { definitivo, esperaSegundos }) {
        await this.conexion.execute(
            'UPDATE correos_salientes SET estado=?, ultimo_error=?, actualizado_en=UTC_TIMESTAMP(3), disponible_desde=UTC_TIMESTAMP(3) + INTERVAL ? SECOND WHERE id=?',
            [definitivo ? 'fallido' : 'pendiente', String(error).slice(0, 500), Math.round(esperaSegundos), id]
        );
    }

    async notificaciones(usuario) {
        const [filas] = await this.conexion.execute(
            'SELECT n.id,n.solicitud_id,n.mensaje,n.leida,n.fecha FROM notificaciones n JOIN usuarios u ON u.id=n.usuario_id WHERE u.usuario=? ORDER BY n.id DESC LIMIT 100',
            [usuario]
        );
        return filas.map(f => ({ id: Number(f.id), solicitudId: f.solicitud_id === null ? null : Number(f.solicitud_id), mensaje: f.mensaje, leida: Boolean(f.leida), fecha: instante(f.fecha).toISOString() }));
    }

    async marcarNotificacionesLeidas(usuario) {
        await this.conexion.execute('UPDATE notificaciones n JOIN usuarios u ON u.id=n.usuario_id SET n.leida=TRUE WHERE u.usuario=? AND n.leida=FALSE', [usuario]);
    }

    async guardarDocumento(actor, id, nombre, contenido) {
        await this.transaccion(async repositorio => {
            await repositorio.conexion.execute('SELECT version FROM control_plataforma WHERE id=1 FOR UPDATE');
            const [filas] = await repositorio.conexion.execute('SELECT usuario_id,revision FROM solicitudes WHERE id=?', [id]);
            const solicitud = filas[0];
            if (!solicitud || Number(solicitud.usuario_id) !== actor.id || solicitud.revision !== 'pendiente') errorUsuario('El PDF requiere una solicitud propia sin revisar.', 403);
            await repositorio.conexion.execute(
                "INSERT INTO documentos (solicitud_id,nombre,tipo,contenido) VALUES (?,?,'application/pdf',?) AS nuevo ON DUPLICATE KEY UPDATE nombre=nuevo.nombre,contenido=nuevo.contenido",
                [id, nombre, contenido]
            );
        });
    }

    async documento(actor, id) {
        const [filas] = await this.conexion.execute('SELECT s.usuario_id,d.nombre,d.contenido FROM documentos d JOIN solicitudes s ON s.id=d.solicitud_id WHERE d.solicitud_id=?', [id]);
        const documento = filas[0];
        return documento && (actor.rol !== 'aspirante' || Number(documento.usuario_id) === actor.id) ? documento : null;
    }

    async documentos(actor) {
        const propio = actor.rol === 'aspirante';
        const [filas] = await this.conexion.execute(
            'SELECT d.solicitud_id,d.nombre FROM documentos d JOIN solicitudes s ON s.id=d.solicitud_id' + (propio ? ' WHERE s.usuario_id=?' : ''),
            propio ? [actor.id] : []
        );
        return filas;
    }
}
