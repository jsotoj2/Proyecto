-- Ejecutar con una cuenta que pueda crear bases; no altera una base existente.
CREATE DATABASE IF NOT EXISTS becas_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Después configura DB_NAME=becas_app y ejecuta npm run migrar.
