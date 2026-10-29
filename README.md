# Plataforma de Becas Nacionales

Proyecto reorganizado con Node.js, JavaScript y MySQL. Incluye acceso, registro, paneles por rol, solicitudes, entrevistas, documentos y administración de cupos.

La aplicación activa está en `cliente/` (interfaz React con Vite) y `servidor/` (API Node.js). `legado/` conserva los archivos anteriores como referencia, incluida la interfaz HTML previa en `legado/publico-html/`; no se usa al iniciar el servidor.

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

La base del proyecto se llama `becas_db`. Si no existe, ejecuta `base-datos/000-crear-base.sql` desde TablePlus o DBeaver con una cuenta autorizada. El esquema (tablas, relaciones y restricciones) se describe en [documentacion/BASE-DE-DATOS.md](documentacion/BASE-DE-DATOS.md).

```powershell
npm run probar-db
npm run migrar
npm run crear-admin
npm run build
npm start
```

`npm run migrar` crea las tablas y carga el catálogo inicial de becas. Se puede ejecutar varias veces: omite lo que ya está aplicado.

Si tienes datos en una base con el esquema anterior (`usuarios_app`, `postulaciones`, `programas_beca`…), cópialos a una `becas_db` vacía con `npm run trasladar -- becas_app`. La base de origen solo se lee. Los detalles están en [documentacion/MIGRACION.md](documentacion/MIGRACION.md).

`npm run build` compila la interfaz en `cliente/dist/`, que es lo que publica el servidor. Abre la dirección definida por `APP_ORIGIN`, inicialmente `http://localhost:3000`. Usa exactamente ese origen para que las peticiones del navegador sean aceptadas.

### Demo sin base de datos

```powershell
npm run demo
```

Compila la interfaz y abre `http://localhost:4173` con la API real sobre datos en memoria: no necesita `.env` ni MySQL, y los cambios se pierden al detenerla. Recupera las cuentas del demo original, todas con contraseña `123`: `alejandro` y `maria` (aspirantes), `admin` y `admin2` (administradores) y `superadmin`. Incluye solicitudes en cada etapa para recorrer todas las pantallas. Para editar estilos con recarga instantánea, ejecuta `npm run demo:servidor` y `npm run dev:demo` en dos terminales y abre `http://localhost:5173`.

### Correos de notificación

Cada vez que una solicitud cambia de etapa (formulario recibido, revisión, entrevista programada o realizada, segunda aprobación y resultado), el aspirante recibe un aviso en el panel y un correo. El correo se guarda en la tabla `correos_salientes` dentro de la misma transacción que el cambio, y un despachador lo envía después, con hasta 5 reintentos con espera creciente. Si el cambio se revierte, no se envía nada; si el servidor de correo no responde, el correo se reintenta.

Configura el envío en `.env` (consulta `.env.example`):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` y `CORREO_REMITENTE`: datos del servidor SMTP (por ejemplo, el de Google Workspace, Microsoft 365 o un servicio como SendGrid o Amazon SES).
- Sin `SMTP_HOST`, en desarrollo cada correo se guarda como HTML en `correos-locales/` para revisarlo en el navegador. En producción quedan pendientes en la bandeja hasta configurar el SMTP.
- `CORREO_TRANSPORTE` fuerza el modo: `smtp`, `archivo` o `desactivado`.

#### Configurar Gmail (gratis)

1. Crea una cuenta de Gmail solo para el proyecto (por ejemplo `becasnacionales.proyecto@gmail.com`). Las cuentas institucionales suelen bloquear este método.
2. En esa cuenta activa la **verificación en dos pasos**: Cuenta de Google → Seguridad → Verificación en dos pasos.
3. Crea una **contraseña de aplicación** en https://myaccount.google.com/apppasswords con el nombre "Becas Nacionales". Google muestra 16 letras; cópialas sin espacios.
4. Completa en `.env`:

```dotenv
CORREO_REMITENTE="Becas Nacionales <becasnacionales.proyecto@gmail.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=becasnacionales.proyecto@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
```

5. Comprueba la configuración enviándote un correo de prueba:

```powershell
npm run probar-correo -- tu.correo@gmail.com
```

Gmail permite unos 500 correos al día, suficiente para el proyecto. Nunca subas `.env` al repositorio: la contraseña de aplicación da acceso a la cuenta. Si se filtra, revócala en la misma página y crea otra.

#### Otras opciones sin Gmail

**Brevo** (envía correos reales; plan gratuito de 300 correos al día). Crea una cuenta en brevo.com, verifica en *Senders* el correo que usarás como remitente (Brevo te envía un enlace) y genera una clave en *SMTP & API → SMTP*. En esa misma pantalla aparecen el servidor y el usuario SMTP:

```dotenv
CORREO_REMITENTE="Becas Nacionales <el.correo.que.verificaste@dominio.com>"
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=el-usuario-smtp-que-muestra-brevo
SMTP_PASSWORD=la-clave-smtp-de-brevo
```

**Mailtrap Email Sandbox** (solo para pruebas y presentaciones: los correos no llegan a nadie, se ven en la bandeja de Mailtrap). Los datos están en la pestaña *Integration* de tu sandbox:

```dotenv
CORREO_REMITENTE="Becas Nacionales <no-responder@becas.test>"
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=usuario-del-sandbox
SMTP_PASSWORD=contrasena-del-sandbox
```

En ambos casos comprueba con `npm run probar-correo -- tu@correo.com`.

Después de actualizar el código ejecuta `npm run migrar`; las tablas se describen en `documentacion/BASE-DE-DATOS.md`. La demo guarda los correos en `correos-locales/demo/` y nunca envía correos reales.

### Desarrollo de la interfaz

Ejecuta la API y Vite en dos terminales:

```powershell
npm run dev:servidor
npm run dev
```

Abre `http://localhost:5173`. Vite recarga los cambios al instante y reenvía `/api` al servidor del puerto `PORT`, ajustando la cabecera `Origin` a `APP_ORIGIN` para que la API acepte las escrituras.

## Crear el primer administrador

`npm run crear-admin` pide usuario, nombre, correo, rol y contraseña oculta. Selecciona `superadmin` para gestionar usuarios y cupos; selecciona `admin` para revisar solicitudes y entrevistas. No se permite crear otro superadministrador mediante este asistente si ya hay uno activo.

Después, el superadministrador crea las demás cuentas desde la app, en **Superadministración → Usuarios**. La segunda aprobación de montos altos necesita al menos dos administradores distintos.

Si prefieres ejecutar el INSERT en TablePlus o DBeaver:

```powershell
npm run generar-sql-admin
```

Ese comando genera `administrador.local.sql` con los datos indicados y un hash scrypt. Ejecuta el archivo sobre la base ya migrada. El archivo no contiene la contraseña en texto plano y está excluido de Git. No se distribuye una cuenta compartida ni una contraseña fija. La consulta de administradores está en `base-datos/administradores.sql`.

## Estructura

```text
cliente/                  Interfaz React (Vite)
  src/api/                Cliente HTTP y almacén del estado del panel
  src/componentes/        Interfaz reutilizable: ui/, alertas/ (SweetAlert2), layout/
  src/estado/             Sesión y datos compartidos
  src/hooks/              useOperacion, useTitulo
  src/paginas/            acceso/, comun/, aspirante/, admin/, superadmin/
  src/utilidades/         Formatos, reglas de presentación y constancia PDF
  src/estilos/            Tokens de diseño y estilos base
servidor/
  api/                    Rutas y respuestas HTTP
  configuracion/          Variables y pool MySQL
  repositorios/           Consultas y transacciones
  servicios/              Autenticación y reglas de negocio
  correo/                 Plantillas, transportes y despachador de correos
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
npm run build
```

`npm test` ejecuta las pruebas del servidor (`node --test`) y las del cliente (Vitest). Las pruebas habituales no requieren MySQL. Para integración real, crea una base **vacía** cuyo nombre termine en `_pruebas`, copia `.env.pruebas.example` a `.env.pruebas`, configura credenciales y ejecuta `npm run test:integracion`. El test crea datos exclusivamente allí y los conserva para inspección; no acepta una base que ya tenga tablas.

## Documentación

- [Arquitectura y decisiones](documentacion/ARQUITECTURA.md)
- [Rutas y contratos de la API](documentacion/API.md)
- [Base de datos: tablas y relaciones](documentacion/BASE-DE-DATOS.md)
- [Migración y permisos MySQL](documentacion/MIGRACION.md)
- [Verificación de esta entrega](documentacion/VERIFICACION.md)

El usuario de ejecución solo necesita permisos de datos. Utiliza una cuenta separada con permisos DDL para migraciones. El servidor no crea tablas automáticamente al iniciar. En producción, configura un proxy HTTPS, `NODE_ENV=production`, `COOKIE_SECURE=true` y TLS hacia MySQL.

## Créditos

Proyecto original: José Carlos Soto, coordinación del equipo.
