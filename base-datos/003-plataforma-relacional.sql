-- Tablas nuevas: no se borran los expedientes históricos ni el JSON original.
CREATE TABLE IF NOT EXISTS control_plataforma (
    id TINYINT UNSIGNED PRIMARY KEY,
    version BIGINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT chk_control_unico CHECK (id = 1)
) ENGINE=InnoDB;
INSERT IGNORE INTO control_plataforma (id, version) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS programas_beca (
    id INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    descripcion TEXT NOT NULL,
    requisitos JSON NOT NULL,
    cupos INT UNSIGNED NOT NULL,
    CONSTRAINT chk_cupos CHECK (cupos <= 100000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS postulaciones (
    id BIGINT UNSIGNED PRIMARY KEY,
    usuario VARCHAR(40) NOT NULL UNIQUE,
    beca_id INT UNSIGNED NOT NULL,
    dpi CHAR(13) NOT NULL,
    fecha_formulario DATE NOT NULL,
    formulario JSON NOT NULL,
    revision ENUM('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
    comentario_revision VARCHAR(2000) NOT NULL DEFAULT '',
    entrevista ENUM('pendiente','programada','realizada') NOT NULL DEFAULT 'pendiente',
    resultado ENUM('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
    comentario_resultado VARCHAR(2000) NOT NULL DEFAULT '',
    FOREIGN KEY (usuario) REFERENCES usuarios_app(usuario),
    FOREIGN KEY (beca_id) REFERENCES programas_beca(id),
    INDEX idx_beca_resultado (beca_id, resultado),
    INDEX idx_revision (revision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS horarios_entrevista (
    id BIGINT UNSIGNED PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    modalidad ENUM('Presencial','Virtual') NOT NULL,
    usuario VARCHAR(40) NULL UNIQUE,
    FOREIGN KEY (usuario) REFERENCES postulaciones(usuario),
    UNIQUE KEY uq_horario (fecha, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS descargas_formulario (
    usuario VARCHAR(40) NOT NULL,
    beca_id INT UNSIGNED NOT NULL,
    fecha DATE NOT NULL,
    PRIMARY KEY (usuario, beca_id),
    FOREIGN KEY (usuario) REFERENCES usuarios_app(usuario),
    FOREIGN KEY (beca_id) REFERENCES programas_beca(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS actividad_plataforma (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    texto VARCHAR(1000) NOT NULL,
    fecha VARCHAR(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Una sola tabla de autenticación evita duplicar contraseñas por rol.
CREATE OR REPLACE VIEW administradores AS
SELECT id, usuario, nombre, correo, rol, activo
FROM usuarios_app WHERE rol IN ('admin', 'superadmin');
