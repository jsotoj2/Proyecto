-- Los administradores se autentican mediante usuarios_app.
-- La vista administradores no incluye hashes de contraseñas.
SELECT id, usuario, nombre, correo, rol, activo FROM administradores;

-- Para crear la primera cuenta:
-- 1. Ejecuta npm run crear-admin desde la raíz del proyecto.
-- 2. Para trabajar exclusivamente con DBeaver, ejecuta npm run generar-sql-admin.
-- 3. Abre administrador.local.sql, selecciona la base migrada y ejecútalo.
-- El script genera un hash scrypt compatible con el servidor; no uses SHA2 ni texto plano.
