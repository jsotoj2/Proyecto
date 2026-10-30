-- Cuentas de los tres roles en una sola tabla: aspirantes, administradores y superadministradores.
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(40) NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    dpi CHAR(13) NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('aspirante','admin','superadmin') NOT NULL DEFAULT 'aspirante',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_usuarios_usuario UNIQUE (usuario),
    CONSTRAINT uq_usuarios_correo UNIQUE (correo),
    CONSTRAINT uq_usuarios_dpi UNIQUE (dpi),
    CONSTRAINT chk_usuarios_dpi CHECK (dpi IS NULL OR dpi REGEXP '^[0-9]{13}$'),
    -- Un aspirante siempre necesita DPI; el personal administrativo puede no tenerlo.
    CONSTRAINT chk_usuarios_dpi_aspirante CHECK (rol <> 'aspirante' OR dpi IS NOT NULL),
    INDEX idx_usuarios_rol (rol, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Solo se guarda el hash del token; la cookie del navegador lleva el valor original.
CREATE TABLE IF NOT EXISTS sesiones (
    token_hash CHAR(64) PRIMARY KEY,
    usuario_id BIGINT UNSIGNED NOT NULL,
    expira DATETIME(3) NOT NULL,
    CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_sesiones_expira (expira)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
