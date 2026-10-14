# Crear nuevas becas

La opción anterior solo permitía modificar cupos. Ahora el superadministrador puede crear programas desde **Becas y cupos**.

1. Detén el servidor con Ctrl+C en la terminal donde está ejecutándose.
2. Extrae `actualizacion-crear-becas.zip` dentro de la carpeta del proyecto, conservando las carpetas `publico`, `servidor`, `pruebas` y `documentacion`. Acepta reemplazar los archivos incluidos.
3. Ejecuta `npm start` y recarga el navegador con Ctrl+F5.
4. Inicia sesión con rol `superadmin` y abre **Becas y cupos**.
5. Completa nombre, descripción, cupos y un requisito por línea. Pulsa **Crear beca**.

No se modifica `.env`, no se cambian dependencias y no hay nuevas migraciones SQL. La tabla `programas_beca` de la entrega anterior ya admite los registros nuevos. Los aspirantes verán las becas al cargar o actualizar su panel; la caché de lecturas dura 15 segundos.

La API valida permisos, campos, nombre duplicado y versión de los datos. Las cuentas `admin` mantienen sus funciones de revisión; la gestión del catálogo y cupos corresponde a `superadmin`.

Verificado: 15 pruebas automatizadas y formulario en Chromium con API simulada. La creación contra la base MySQL del usuario debe comprobarse después de aplicar esta actualización.
