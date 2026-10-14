# Migración y conexión MySQL

## Antes de aplicar cambios

1. Realiza un respaldo de la base existente y comprueba que puedes restaurarlo.
2. Detén el servidor anterior durante la migración. El proceso no puede impedir que una versión antigua continúe escribiendo en su JSON.
3. Configura `.env` con una cuenta de migración autorizada sobre la base correcta.
4. Ejecuta `npm run probar-db` y después `npm run migrar`.
5. Crea el administrador si falta y arranca únicamente la versión nueva.

No se ha conectado esta entrega a la base del usuario: el proyecto facilitado no contenía un `.env` con credenciales. Las migraciones no se ejecutaron sobre una base real durante esta sesión.

## Orden de aplicación

| Paso | Efecto |
| --- | --- |
| `000-crear-base.sql` | Creación opcional de `becas_app`, ejecutada manualmente |
| `001-historico.sql` | Tablas de solicitudes históricas, sin borrar datos |
| `002-usuarios.sql` | Usuarios, sesiones, documentos y tabla de estado anterior |
| `003-plataforma-relacional.sql` | Tablas por entidad y vista de administradores |
| Traslado de datos | Copia el JSON anterior a las tablas nuevas en una transacción; conserva el original |
| `004-integridad.sql` | Clave foránea de documentos e índices de sesiones y roles |

El comando registra cada sentencia y su checksum en `migraciones`. Volver a ejecutarlo omite lo ya aplicado. Un bloqueo nombrado de MySQL impide dos migradores simultáneos. Las sentencias DDL confirman automáticamente en MySQL; por eso la migración completa no promete ser atómica. El traslado de datos sí usa commit/rollback.

Si el estado anterior contiene referencias inexistentes —por ejemplo una solicitud de un usuario eliminado o un documento huérfano—, las claves foráneas provocan un error. Revisa esos registros en la copia de respaldo; no elimines restricciones para ocultar el problema. El servidor exige que se haya completado también la última migración.

No ejecutes únicamente los archivos SQL sobre una base con datos anteriores: el traslado del JSON requiere `npm run migrar`. No arranques de nuevo la versión antigua tras una migración con nuevas escrituras, porque su JSON habrá quedado desactualizado.

## Permisos

Usa cuentas separadas para migraciones y ejecución. La cuenta de ejecución necesita `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre las tablas de la aplicación. La cuenta de migración necesita además permisos para crear y alterar tablas, índices y vistas. Crear la base y conceder permisos corresponde a la cuenta de administración de MySQL o al panel del proveedor.

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
