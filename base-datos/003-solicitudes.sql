-- Una solicitud recorre cuatro etapas: formulario, revisión, entrevista y decisión final.
-- La regla de la convocatoria actual es una solicitud por aspirante.
CREATE TABLE IF NOT EXISTS solicitudes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    beca_id INT UNSIGNED NOT NULL,
    -- Etapa 1: formulario
    edad TINYINT UNSIGNED NOT NULL,
    telefono CHAR(8) NOT NULL,
    direccion VARCHAR(500) NOT NULL,
    estudios VARCHAR(300) NOT NULL,
    promedio DECIMAL(5,2) NOT NULL,
    monto DECIMAL(12,2) NULL,
    motivo TEXT NOT NULL,
    fecha_envio DATE NOT NULL,
    constancia_descargada_en DATE NULL,
    -- Etapa 2: revisión del formulario
    revision ENUM('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
    comentario_revision VARCHAR(2000) NOT NULL DEFAULT '',
    revisado_por BIGINT UNSIGNED NULL,
    -- Etapa 3: entrevista (la fecha y la modalidad están en horarios_entrevista)
    entrevista ENUM('pendiente','programada','realizada') NOT NULL DEFAULT 'pendiente',
    -- Etapa 4: decisión final y segunda aprobación para montos altos
    resultado ENUM('pendiente','aceptada','rechazada','pendiente_aprobacion') NOT NULL DEFAULT 'pendiente',
    comentario_resultado VARCHAR(2000) NOT NULL DEFAULT '',
    aprobado_por BIGINT UNSIGNED NULL,
    segundo_aprobador BIGINT UNSIGNED NULL,
    actualizada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_solicitudes_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_solicitudes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_solicitudes_beca FOREIGN KEY (beca_id) REFERENCES becas(id),
    CONSTRAINT fk_solicitudes_revisor FOREIGN KEY (revisado_por) REFERENCES usuarios(id),
    CONSTRAINT fk_solicitudes_aprobador FOREIGN KEY (aprobado_por) REFERENCES usuarios(id),
    CONSTRAINT fk_solicitudes_segundo FOREIGN KEY (segundo_aprobador) REFERENCES usuarios(id),
    CONSTRAINT chk_solicitudes_edad CHECK (edad BETWEEN 14 AND 100),
    CONSTRAINT chk_solicitudes_telefono CHECK (telefono REGEXP '^[0-9]{8}$'),
    CONSTRAINT chk_solicitudes_promedio CHECK (promedio BETWEEN 0 AND 100),
    CONSTRAINT chk_solicitudes_monto CHECK (monto IS NULL OR monto > 0),
    -- Las etapas avanzan en orden: no hay entrevista sin revisión aprobada ni decisión sin entrevista.
    CONSTRAINT chk_solicitudes_entrevista CHECK (entrevista = 'pendiente' OR revision = 'aceptada'),
    CONSTRAINT chk_solicitudes_resultado CHECK (resultado = 'pendiente' OR entrevista = 'realizada'),
    INDEX idx_solicitudes_beca_resultado (beca_id, resultado),
    INDEX idx_solicitudes_revision (revision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Un horario queda libre (solicitud_id NULL) o reservado por una sola solicitud.
CREATE TABLE IF NOT EXISTS horarios_entrevista (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    modalidad ENUM('Presencial','Virtual') NOT NULL,
    solicitud_id BIGINT UNSIGNED NULL,
    CONSTRAINT uq_horarios_fecha_hora UNIQUE (fecha, hora),
    CONSTRAINT uq_horarios_solicitud UNIQUE (solicitud_id),
    CONSTRAINT fk_horarios_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PDF adjunto opcional de la solicitud; el dueño se obtiene a través de la solicitud.
CREATE TABLE IF NOT EXISTS documentos (
    solicitud_id BIGINT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    contenido MEDIUMBLOB NOT NULL,
    subido_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_documentos_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
