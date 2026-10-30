-- Consulta las cuentas administrativas (sin hashes de contraseña).
SELECT id, usuario, nombre, correo, rol, activo FROM usuarios WHERE rol IN ('admin', 'superadmin');

-- Para crear la primera cuenta:
-- 1. Ejecuta npm run crear-admin desde la raíz del proyecto.
-- 2. Para trabajar solo con un cliente SQL (TablePlus, DBeaver), ejecuta npm run generar-sql-admin.
-- 3. Abre administrador.local.sql, selecciona la base migrada y ejecútalo.
-- Después, el superadministrador crea los demás administradores desde Superadministración → Usuarios.
-- El script genera un hash scrypt compatible con el servidor; no uses SHA2 ni texto plano.
