CREATE DATABASE IF NOT EXISTS becas_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE becas_app;

-- Tablas del proyecto. Selecciona antes la base becas_app si usas DBeaver.
-- Este archivo no borra tablas ni registros existentes.
CREATE TABLE IF NOT EXISTS estudiantes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cui CHAR(13) NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    correo VARCHAR(254) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_estudiantes_cui (cui)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS becas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(160) NOT NULL,
    nivel VARCHAR(30) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    UNIQUE KEY uq_becas_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitudes (
    expediente VARCHAR(50) NOT NULL,
    estudiante_id BIGINT UNSIGNED NOT NULL,
    beca_id BIGINT UNSIGNED NOT NULL,
    estado VARCHAR(40) NOT NULL DEFAULT 'Recibida',
    fecha DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (expediente),
    UNIQUE KEY uq_solicitud_estudiante_beca (estudiante_id, beca_id),
    CONSTRAINT fk_solicitud_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    CONSTRAINT fk_solicitud_beca FOREIGN KEY (beca_id) REFERENCES becas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos (
    expediente VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    contenido MEDIUMBLOB NOT NULL,
    PRIMARY KEY (expediente),
    CONSTRAINT fk_documento_solicitud FOREIGN KEY (expediente) REFERENCES solicitudes(expediente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo inicial: las mismas tres becas de la interfaz existente.
INSERT INTO becas (nombre, nivel) VALUES
('Beca Excelencia en STEAM', 'universitario'),
('Beca Diversificado Regional', 'medio'),
('Beca Maestrías de Impacto Social', 'posgrado')
ON DUPLICATE KEY UPDATE id = id;

