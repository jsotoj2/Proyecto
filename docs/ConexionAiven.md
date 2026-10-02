# Aiven MySQL: base de datos y conexión del proyecto de becas

## Qué quedó preparado

El proyecto conserva HTML, CSS y JavaScript. Ahora el formulario consume una API de Node.js, la lógica de negocio se ejecuta en el backend y un repositorio accede a MySQL. La base propuesta se llama `becas_app`. La creación real y la prueba en Aiven requieren que completes las credenciales en tu computadora.

```text
Proyecto/
├── Frontend/                          Presentación
│   ├── script.js                      Conecta la interfaz con la API
│   └── js/solicitudApi.js              Peticiones HTTP
├── Negocio/solicitudServicio.js        Reglas ejecutadas por el servidor
├── Datos/solicitudRepositorioMySQL.js  Consultas parametrizadas y transacciones
├── Backend/
│   ├── .env.example                   Ejemplo de configuración
│   ├── .env                           Tus credenciales locales
│   ├── certificados/ca.pem            Certificado descargado de Aiven
│   ├── configuracionMySQL.js          Lee y valida la configuración
│   ├── conexion.js                   Pool de conexión
│   ├── esquema.sql                   Tablas y becas iniciales
│   ├── crearBaseDBeaver.sql           Script completo para DBeaver
│   ├── iniciarBaseDatos.js            Alternativa para crear la base desde Node
│   ├── probarConexion.js             Prueba de acceso
│   ├── aplicacion.js                 API y archivos públicos
│   └── servidor.js                   Inicio del servidor
└── docs/ConexionAiven.md              Esta guía
```

## 1. Encuentra los datos de conexión en Aiven

Abre tu servicio MySQL en Aiven y revisa la información de conexión. Copia el host, puerto, usuario y contraseña. El puerto suele ser diferente de 3306: usa exactamente el que aparece en tu servicio.

Descarga el certificado CA desde Aiven. Dentro de `Backend` crea una carpeta llamada `certificados` y guarda el certificado como `ca.pem`. Es un archivo que se descarga; no escribas el certificado a mano. La conexión preparada verifica el certificado TLS.

No necesitas crear otro servicio de MySQL para este proyecto: crearás una base dentro del servicio que ya tienes. Si tu proveedor muestra `defaultdb`, esa es una base inicial distinta de `becas_app`.

## 2. Crea la base y las tablas desde DBeaver

1. Abre la conexión MySQL de Aiven que ya probaste en DBeaver.
2. Abre un editor SQL asociado a esa conexión.
3. Abre o pega el contenido de `Backend/crearBaseDBeaver.sql`.
4. Ejecuta el script completo, no solamente la primera sentencia.
5. Actualiza el navegador de bases de datos de DBeaver y expande `becas_app`.

El script crea la base si no existe y estas cuatro tablas:

| Tabla | Qué guarda |
|---|---|
| `estudiantes` | CUI, nombre y correo |
| `becas` | Nombre, nivel y disponibilidad de cada beca |
| `solicitudes` | Expediente, estudiante, beca, estado y fecha |
| `documentos` | Nombre y contenido del PDF asociado al expediente |

Las claves foráneas relacionan las tablas. Un índice único evita repetir la misma combinación de estudiante y beca. El catálogo inicial incluye las mismas tres becas que muestra la página. El script no borra datos ni sustituye tablas existentes; no es una migración para esquemas diferentes.

Si el usuario no tiene permiso para crear bases mediante SQL, crea `becas_app` en el apartado Databases de tu servicio en Aiven. Después selecciona esa base en DBeaver y ejecuta `Backend/esquema.sql`. Necesitas permisos para crear las tablas.

## 3. Prepara Node.js

En la terminal de VS Code ejecuta, por separado:

```powershell
node --version
npm --version
```

Necesitas Node.js 22 o posterior. Si no se reconocen, instala la versión LTS desde [Node.js](https://nodejs.org/en/download) y vuelve a abrir VS Code.

Con la terminal ubicada en la carpeta `Proyecto`, ejecuta:

```powershell
cd Backend
npm install mysql2
```

Esto instala el conector y registra la dependencia. Solo la carpeta del backend necesita este paquete.

## 4. Coloca tus credenciales

Dentro de `Backend`, copia `.env.example` como `.env` una sola vez:

```powershell
Copy-Item .env.example .env
```

Si ya existe `.env`, edítalo directamente en vez de volver a copiar. Abre ese archivo en VS Code y completa:

```dotenv
DB_HOST="tu-host.aivencloud.com"
DB_PORT=12345
DB_USER="avnadmin"
DB_PASSWORD="tu_contraseña"
DB_NAME="becas_app"
DB_SSL=true
DB_SSL_CA="./certificados/ca.pem"
DB_SSL_CERT=""
DB_SSL_KEY=""
PORT=3000
```

**El host y el puerto del ejemplo son ficticios.** Usa los datos reales de Aiven. El usuario `avnadmin` es habitual, pero debes usar el que corresponda a tu servicio. `DB_NAME` debe coincidir con la base que creaste. `PORT=3000` es el puerto de la aplicación local y es diferente de `DB_PORT`, que pertenece a MySQL.

El archivo `.gitignore` excluye `.env`, los certificados y `node_modules`. `.env.example` contiene únicamente ejemplos. No coloques las credenciales en el frontend ni las compartas en capturas.

## 5. Comprueba la conexión

Desde `Backend` ejecuta:

```powershell
npm run probar-db
```

Esta prueba hace `SELECT 1` y no escribe datos. Debe responder «Conexión a MySQL correcta».

Si preferiste no ejecutar SQL desde DBeaver, después de configurar `.env` puedes crear la base y sus tablas con:

```powershell
npm run iniciar-db
```

Este comando necesita permiso para crear bases y tablas. Es una alternativa al paso 2. Puedes ejecutarlo antes de `probar-db` si `becas_app` todavía no existe. Si falla a mitad, revisa el error y vuelve a ejecutar: las sentencias usan `IF NOT EXISTS` y el catálogo no se duplica.

## 6. Abre la aplicación

Desde `Backend` ejecuta:

```powershell
npm start
```

Mantén esa terminal abierta y entra en [http://localhost:3000](http://localhost:3000). Este servidor sirve la página y la API desde la misma dirección. Para esta versión usa esa dirección en lugar de Live Server. El servidor está configurado para funcionar solo en tu computadora.

Prueba una postulación con datos ficticios y un PDF pequeño. Copia el expediente y consulta por CUI y expediente. En DBeaver puedes comprobar los registros:

```sql
USE becas_app;
SELECT * FROM estudiantes;
SELECT * FROM becas;
SELECT * FROM solicitudes;
SELECT expediente, nombre, OCTET_LENGTH(contenido) AS bytes_pdf FROM documentos;
```

El estado inicial es `Recibida`. Los PDF admiten hasta 5 MB. El registro del estudiante, la solicitud y su PDF se guarda dentro de una transacción: si falla una parte, se revierte el conjunto.

## Errores habituales

| Mensaje o código | Qué revisar |
|---|---|
| Comando `node` o `npm` no reconocido | Instalación de Node.js y reapertura de VS Code |
| `ENOENT` al leer certificado | Archivo `Backend/certificados/ca.pem` y su ruta |
| `ER_ACCESS_DENIED_ERROR` | Usuario, contraseña y permisos |
| `ER_BAD_DB_ERROR` | Base creada y valor de `DB_NAME` |
| `ER_NO_SUCH_TABLE` | Ejecutar el esquema en la base correcta |
| `ENOTFOUND` | Host exacto, sin `https://` ni puerto |
| `ECONNREFUSED` o `ETIMEDOUT` | Puerto, servicio encendido y restricciones de red del proveedor |
| Error de certificado | CA descargada del servicio correcto y configuración TLS |
| `EADDRINUSE` | Otra aplicación usa el puerto 3000; cambia `PORT` |

## Alcance de esta versión

Es una integración para desarrollo local. La autenticación y los permisos por usuario aún no están implementados. Los registros antiguos de IndexedDB no se copian automáticamente a MySQL. El código del repositorio anterior se conserva como referencia, pero la página utiliza la API del backend.

Se probaron el formulario, la API, validaciones, consultas, manejo de PDF y comportamiento de rollback mediante pruebas locales con un repositorio de prueba. La conexión real, el esquema SQL y el guardado en Aiven requieren verificación con tu servicio tras completar `.env`; no se ejecutaron comandos sobre Aiven desde esta sesión.

Referencias: [Aiven: conexión y creación de bases](https://aiven.io/docs/products/mysql/howto/connect-from-mysql-workbench), [certificados TLS de Aiven](https://aiven.io/docs/platform/concepts/tls-ssl-certificates), [mysql2](https://sidorares.github.io/node-mysql2/docs).
