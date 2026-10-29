-- Avisos dentro de la plataforma para el aspirante.
CREATE TABLE IF NOT EXISTS notificaciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    solicitud_id BIGINT UNSIGNED NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha DATETIME(3) NOT NULL,
    CONSTRAINT fk_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_notificaciones_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE SET NULL,
    INDEX idx_notificaciones_usuario (usuario_id, leida, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bandeja de salida de correos: se escribe en la misma transacción que el cambio de etapa
-- y un despachador la envía después, con reintentos. Las fechas se guardan en UTC.
CREATE TABLE IF NOT EXISTS correos_salientes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NULL,
    destinatario VARCHAR(254) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    texto TEXT NOT NULL,
    html MEDIUMTEXT NOT NULL,
    estado ENUM('pendiente','enviando','enviado','fallido') NOT NULL DEFAULT 'pendiente',
    intentos TINYINT UNSIGNED NOT NULL DEFAULT 0,
    ultimo_error VARCHAR(500) NULL,
    creado_en DATETIME(3) NOT NULL,
    disponible_desde DATETIME(3) NOT NULL,
    actualizado_en DATETIME(3) NOT NULL,
    enviado_en DATETIME(3) NULL,
    CONSTRAINT fk_correos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_correos_cola (estado, disponible_desde),
    INDEX idx_correos_usuario (usuario_id, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bitácora única: cada operación exitosa o rechazada deja una fila. "descripcion" es el texto
-- de la actividad reciente; actor_usuario y usuario_solicitud conservan el nombre aunque la cuenta cambie.
CREATE TABLE IF NOT EXISTS bitacora (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME(3) NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    actor_usuario VARCHAR(40) NOT NULL,
    actor_rol ENUM('aspirante','admin','superadmin') NULL,
    operacion VARCHAR(40) NOT NULL,
    solicitud_id BIGINT UNSIGNED NULL,
    usuario_solicitud VARCHAR(40) NULL,
    estado_anterior VARCHAR(40) NULL,
    estado_nuevo VARCHAR(40) NULL,
    resultado ENUM('exito','rechazado') NOT NULL,
    descripcion VARCHAR(1000) NOT NULL DEFAULT '',
    detalle VARCHAR(2000) NOT NULL DEFAULT '',
    CONSTRAINT fk_bitacora_actor FOREIGN KEY (actor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_bitacora_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE SET NULL,
    INDEX idx_bitacora_fecha (fecha),
    INDEX idx_bitacora_solicitud (usuario_solicitud, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Número de versión de los datos: cada cambio lo incrementa y una pantalla desactualizada recibe 409.
CREATE TABLE IF NOT EXISTS control_plataforma (
    id TINYINT UNSIGNED PRIMARY KEY,
    version BIGINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT chk_control_unico CHECK (id = 1)
) ENGINE=InnoDB;
INSERT IGNORE INTO control_plataforma (id, version) VALUES (1, 0);
