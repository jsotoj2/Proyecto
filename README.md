# Plataforma de Becas Nacionales

Proyecto reorganizado con Node.js, JavaScript y MySQL. Incluye acceso, registro, paneles por rol, solicitudes, entrevistas, documentos y administración de cupos.

La aplicación activa está en `publico/` y `servidor/`. `legado/` conserva los archivos anteriores como referencia; no se usa al iniciar el servidor. Se incorporó el rediseño del frontend trabajado en este chat.

## Requisitos

- Node.js 22 o superior y npm.
- MySQL 8.0.16 o superior, local o remoto.
- Una base de datos y credenciales con permisos apropiados.

## Instalar y configurar

Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env
```

Completa `.env` con tu conexión. No existen contraseñas predeterminadas. Para MySQL local puedes indicar `DB_SSL=false`; para Aiven u otro proveedor remoto utiliza `DB_SSL=true` y su certificado CA. Las rutas de certificados relativas se resuelven desde la raíz del proyecto.

Si no tienes base de datos, ejecuta `base-datos/000-crear-base.sql` desde DBeaver con una cuenta autorizada. Si ya tienes una base, conserva su nombre en `DB_NAME` y realiza un respaldo antes de migrar.

```powershell
npm run probar-db
npm run migrar
npm run crear-admin
npm start
```

Abre la dirección definida por `APP_ORIGIN`, inicialmente `http://localhost:3000`. Usa exactamente ese origen para que las peticiones del navegador sean aceptadas.

## Crear el primer administrador

`npm run crear-admin` pide usuario, nombre, correo, rol y contraseña oculta. Selecciona `superadmin` para gestionar usuarios y cupos; selecciona `admin` para revisar solicitudes y entrevistas. No se permite crear otro superadministrador mediante este asistente si ya hay uno activo.

Si prefieres ejecutar el INSERT en DBeaver:

```powershell
npm run generar-sql-admin
```

Ese comando genera `administrador.local.sql` con los datos indicados y un hash scrypt. Ejecuta el archivo sobre la base ya migrada. El archivo no contiene la contraseña en texto plano y está excluido de Git. No se distribuye una cuenta compartida ni una contraseña fija. La consulta de administradores está en `base-datos/administradores.sql`.

## Estructura

```text
publico/                  Interfaz del navegador
servidor/
  api/                    Rutas y respuestas HTTP
  configuracion/          Variables y pool MySQL
  repositorios/           Consultas y transacciones
  servicios/              Autenticación y reglas de negocio
base-datos/               Migraciones y catálogo inicial
scripts/                  Comandos de operación
pruebas/                  Pruebas automatizadas
documentacion/            Arquitectura, API y migración
legado/                   Referencia del proyecto anterior
```

## Verificar cambios

```powershell
npm test
npm run verificar
```

Las pruebas habituales no requieren MySQL. Para integración real, crea una base **vacía** cuyo nombre termine en `_pruebas`, copia `.env.pruebas.example` a `.env.pruebas`, configura credenciales y ejecuta `npm run test:integracion`. El test crea datos exclusivamente allí y los conserva para inspección; no acepta una base que ya tenga tablas.

## Documentación

- [Arquitectura y decisiones](documentacion/ARQUITECTURA.md)
- [Rutas y contratos de la API](documentacion/API.md)
- [Migración y permisos MySQL](documentacion/MIGRACION.md)
- [Verificación de esta entrega](documentacion/VERIFICACION.md)

El usuario de ejecución solo necesita permisos de datos. Utiliza una cuenta separada con permisos DDL para migraciones. El servidor no crea tablas automáticamente al iniciar. En producción, configura un proxy HTTPS, `NODE_ENV=production`, `COOKIE_SECURE=true` y TLS hacia MySQL.

## Créditos

Proyecto original: José Carlos Soto, coordinación del equipo.
