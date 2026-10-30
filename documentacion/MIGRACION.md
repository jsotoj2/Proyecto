# Migración y conexión MySQL

## Antes de aplicar cambios

1. Realiza un respaldo de la base existente y comprueba que puedes restaurarlo.
2. Detén el servidor anterior durante la migración. El proceso no puede impedir que una versión antigua continúe escribiendo en su JSON.
3. Configura `.env` con una cuenta de migración autorizada sobre la base correcta.
4. Ejecuta `npm run probar-db` y después `npm run migrar`.
5. Crea el administrador si falta y arranca únicamente la versión nueva.

El esquema está descrito en [BASE-DE-DATOS.md](BASE-DE-DATOS.md).

## Orden de aplicación

| Paso | Efecto |
| --- | --- |
| `000-crear-base.sql` | Creación opcional de `becas_db`, ejecutada manualmente |
| `001-usuarios.sql` | Usuarios y sesiones |
| `002-becas.sql` | Becas y requisitos |
| `003-solicitudes.sql` | Solicitudes, horarios de entrevista y documentos |
| `004-seguimiento.sql` | Notificaciones, correos salientes, bitácora y control de versión |
| Catálogo inicial | Si la base no tiene becas, carga `catalogo-inicial.json` una sola vez |

## Traslado desde el esquema anterior

El esquema anterior (`usuarios_app`, `postulaciones`, `programas_beca`, `actividad_plataforma`…) sigue en la base `becas_app`. Para copiar sus datos a una base nueva con el esquema actual:

```bash
npm run trasladar -- becas_app
```

El destino es la base de `DB_NAME`, que debe estar vacía. El comando aplica las migraciones, copia usuarios (con sus contraseñas), becas, solicitudes, horarios, documentos, actividad, auditoría y notificaciones en una sola transacción, y muestra cuántos registros copió de cada tabla. La base de origen solo se lee. Las sesiones no se copian, así que cada usuario vuelve a iniciar sesión.

El comando registra cada sentencia y su checksum en `migraciones`. Volver a ejecutarlo omite lo ya aplicado. Un bloqueo nombrado de MySQL impide dos migradores simultáneos. Las sentencias DDL confirman automáticamente en MySQL; por eso la migración completa no promete ser atómica. El traslado de datos sí usa commit/rollback.

Los saltos de línea se normalizan antes de calcular el checksum, así que da igual si el proyecto se clonó en Windows (CRLF) o en macOS (LF).

Si los datos de origen contienen referencias inexistentes o valores fuera de las restricciones (por ejemplo, un teléfono que no tiene 8 dígitos), el traslado se revierte completo y muestra el error. Corrige esos registros en el origen; no elimines restricciones para ocultar el problema. El servidor exige que se hayan completado todas las migraciones antes de arrancar.

## Permisos

Usa cuentas separadas para migraciones y ejecución. La cuenta de ejecución necesita `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre las tablas de la aplicación. La cuenta de migración necesita además permisos para crear y alterar tablas e índices. Crear la base y conceder permisos corresponde a la cuenta de administración de MySQL o al panel del proveedor.

El asistente `crear-admin` crea una cuenta de la **aplicación**, no un usuario de MySQL. No uses las credenciales de MySQL para iniciar sesión en la interfaz.

## Certificados y conexión

- `DB_HOST` contiene solo el dominio o IP; el puerto va en `DB_PORT`.
- `DB_SSL=true` activa TLS con comprobación del certificado del servidor.
- `DB_SSL_CA` admite una ruta absoluta o relativa a la raíz del proyecto.
- Si se exige autenticación TLS de cliente, configura `DB_SSL_CERT` y `DB_SSL_KEY` juntos.
- El pool tiene un máximo configurable y una cola finita para no acumular solicitudes sin límite.
- No se habilitan múltiples sentencias en las consultas de la API.
- La cuenta de migración se puede reemplazar por la cuenta de ejecución antes de `npm start`.

El servidor usa UTC para las sesiones; las entrevistas se interpretan con zona de Guatemala (`UTC−06:00`).

## Diagnóstico

| Código | Revisar |
| --- | --- |
| `ER_ACCESS_DENIED_ERROR` | Credenciales y permisos |
| `ER_BAD_DB_ERROR` | Existencia y nombre de la base |
| `ENOTFOUND` | Dominio y acceso a red |
| `ECONNREFUSED` | Puerto y servicio MySQL |
| `ETIMEDOUT` | Firewall y lista de IP permitidas |
| `ER_NO_REFERENCED_ROW_2` | Referencias inconsistentes en los datos antiguos |
| `CERT_HAS_EXPIRED` | Caducidad del certificado |

La recuperación de una migración problemática se hace sobre un respaldo verificado. No se incluye un rollback destructivo automático.
