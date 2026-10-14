-- Ejecutar después de trasladar el estado antiguo: detecta documentos huérfanos.
ALTER TABLE documentos_plataforma ADD CONSTRAINT fk_documento_postulacion
    FOREIGN KEY (solicitud_id) REFERENCES postulaciones(id);
CREATE INDEX idx_sesion_expira ON sesiones_app (expira);
CREATE INDEX idx_usuario_rol_activo ON usuarios_app (rol, activo);
