-- Programas de beca y sus requisitos (una fila por requisito, en el orden en que se muestran).
CREATE TABLE IF NOT EXISTS becas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(160) NOT NULL,
    descripcion TEXT NOT NULL,
    cupos INT UNSIGNED NOT NULL,
    creada_en DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT uq_becas_nombre UNIQUE (nombre),
    CONSTRAINT chk_becas_cupos CHECK (cupos <= 100000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS requisitos_beca (
    beca_id INT UNSIGNED NOT NULL,
    orden SMALLINT UNSIGNED NOT NULL,
    texto VARCHAR(500) NOT NULL,
    PRIMARY KEY (beca_id, orden),
    CONSTRAINT fk_requisitos_beca FOREIGN KEY (beca_id) REFERENCES becas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
