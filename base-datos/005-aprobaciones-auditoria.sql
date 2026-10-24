-- Segunda aprobación para montos altos, bitácora de solicitudes y avisos a aspirantes.
ALTER TABLE postulaciones MODIFY resultado ENUM('pendiente','aceptada','rechazada','pendiente_aprobacion') NOT NULL DEFAULT 'pendiente';
ALTER TABLE postulaciones ADD COLUMN aprobado_por VARCHAR(40) NULL;

-- Solo se insertan filas: la aplicación no ofrece edición ni borrado de la bitácora.
CREATE TABLE IF NOT EXISTS auditoria_solicitudes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    solicitud_id BIGINT UNSIGNED NULL,
    usuario_solicitud VARCHAR(40) NULL,
    actor_id BIGINT UNSIGNED NOT NULL,
    actor_usuario VARCHAR(40) NOT NULL,
    actor_rol ENUM('aspirante','admin','superadmin') NOT NULL,
    operacion VARCHAR(40) NOT NULL,
    estado_anterior VARCHAR(40) NULL,
    estado_nuevo VARCHAR(40) NULL,
    resultado ENUM('exito','rechazado') NOT NULL,
    detalle VARCHAR(2000) NOT NULL DEFAULT '',
    fecha DATETIME(3) NOT NULL,
    INDEX idx_auditoria_solicitud (usuario_solicitud, fecha),
    INDEX idx_auditoria_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(40) NOT NULL,
    solicitud_id BIGINT UNSIGNED NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha DATETIME(3) NOT NULL,
    FOREIGN KEY (usuario) REFERENCES usuarios_app(usuario),
    INDEX idx_notificacion_usuario (usuario, leida, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
