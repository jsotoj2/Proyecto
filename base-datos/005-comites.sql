CREATE TABLE IF NOT EXISTS comites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  tipo ENUM('academico','financiero','social','umg') NOT NULL,
  descripcion TEXT
);

INSERT INTO comites (nombre, tipo) VALUES
('Comite Academico', 'academico'),
('Comite Financiero', 'financiero'),
('Comite Social', 'social'),
('Comite UMG', 'umg');

CREATE TABLE IF NOT EXISTS beca_comite (
  id INT AUTO_INCREMENT PRIMARY KEY,
  beca_id INT NOT NULL,
  comite_id INT NOT NULL,
  estado ENUM('asignado','en_revision','aprobado','rechazado') DEFAULT 'asignado',
  fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
