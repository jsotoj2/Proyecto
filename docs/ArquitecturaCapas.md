# Arquitectura de capas: aplicación de becas con MySQL

## Distribución

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Presentación | `Frontend/index.html`, `styles.css`, `js/interfaz.js`, `js/solicitudApi.js` | Formularios, diseño, eventos y consumo de la API |
| Negocio | `Negocio/solicitudServicio.js` | Validaciones, registro y consultas de solicitudes |
| Acceso a datos | `Datos/solicitudRepositorioMySQL.js` | Consultas parametrizadas y transacciones MySQL |

`Backend/servidor.js` compone las dependencias. `Backend/aplicacion.js` recibe peticiones HTTP y delega en negocio. `Backend/conexion.js` configura el pool. Los archivos de negocio y MySQL se ejecutan en Node.js; el navegador solo recibe los archivos públicos de `Frontend` y las respuestas de la API.

## Recorrido

`Formulario → solicitudApi → API del backend → SolicitudServicio → SolicitudRepositorioMySQL → Aiven MySQL`

El registro guarda estudiante, solicitud y PDF en una transacción. La respuesta de éxito solo se devuelve después del commit. La consulta por CUI devuelve un listado; la consulta por expediente devuelve una solicitud o null. La presentación muestra un mensaje si no hay registros.

## Reglas iniciales

- CUI de 13 dígitos: es una validación de formato, no de identidad.
- Nombre y correo obligatorios y dentro de los límites de las columnas.
- Beca perteneciente al catálogo activo de MySQL.
- PDF de hasta 5 MB con extensión y cabecera PDF. No se analiza su contenido.
- Una solicitud por estudiante y beca, garantizada por el índice único.
- Expediente con UUID y estado inicial `Recibida`.

Estas reglas deben ajustarse a los requisitos que acuerde el equipo. No se implementaron fechas límite ni criterios de elegibilidad no definidos.

## Base de datos

`estudiantes` y `becas` se relacionan mediante `solicitudes`. Cada solicitud tiene un documento PDF en `documentos`. El esquema está en `Backend/esquema.sql`. La versión completa para crear también `becas_app` desde DBeaver está en `Backend/crearBaseDBeaver.sql`.

## Ejecución y trabajo en equipo

Sigue `docs/ConexionAiven.md` para configurar `.env`, instalar mysql2, crear tablas y ejecutar `npm start` desde `Backend`. La aplicación abre en `http://localhost:3000`. El backend está limitado a conexiones desde la computadora local.

El equipo de presentación trabaja en `Frontend`, el de reglas en `Negocio` y el de persistencia en `Datos` y el esquema SQL. Deben mantener los contratos del servicio: `registrar`, `consultarPorCui` y `consultarPorExpediente`.

La versión anterior guardaba en IndexedDB. `Datos/solicitudRepositorio.js` se conserva como referencia, pero ya no está conectado al frontend. Los datos locales antiguos no se migran automáticamente.

## Pendiente

La conexión real con Aiven y las operaciones SQL deben comprobarse después de completar las credenciales. La autenticación y autorización por usuario, revisión por comité y aprobación requieren desarrollo adicional. Esta versión corresponde a desarrollo local.
