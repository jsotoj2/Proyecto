# Arquitectura de la aplicación recuperada

La base visual y las pantallas por fases se recuperaron de la rama `EstrucuturaPorCapas`, commit `fb61c2d`. Se conservan los paneles de aspirante, administrador y superadministrador, sus menús, revisión de formulario, entrevistas, decisión final, cupos y estadísticas.

## Capas

| Capa | Archivos | Responsabilidad |
|---|---|---|
| Presentación | `Frontend/index.html`, `dashboard.html`, `css/style.css`, `js/app.js`, `js/roles/`, `js/archivos.js` | Formularios, navegación, paneles y mensajes |
| Adaptador HTTP del cliente | `Frontend/js/data/datos.js` | Obtiene datos del backend y traduce las acciones de las pantallas originales a solicitudes HTTP |
| Negocio | `Negocio/autenticacionServicio.js`, `plataformaServicio.js` | Registro, contraseñas, permisos, validaciones, transiciones por fases y cupos |
| Datos | `Datos/plataformaRepositorioMySQL.js`, `estadoInicial.json` | Consultas parametrizadas y transacciones en MySQL |
| Entrada del servidor | `Backend/servidor.js`, `plataformaApi.js`, `aplicacion.js` | HTTP, cookies, archivos, límites de peticiones y composición de capas |

El navegador ya no guarda cuentas, contraseñas ni solicitudes en `localStorage`. Solo mantiene una copia temporal de los datos autorizados para dibujar la pantalla. El servidor consulta el rol real en MySQL antes de cada acción; modificar la interfaz no otorga permisos.

## Almacenamiento

Las cuatro tablas anteriores (`estudiantes`, `becas`, `solicitudes`, `documentos`) se conservan. Sus expedientes y PDF aparecen en “Documentos y registros anteriores”; el aspirante ve los que coinciden con su DPI y el administrador puede consultarlos todos. Las solicitudes anteriores conservan su estado original: no se inventan formularios académicos ni fases que nunca se completaron.

Las cuentas nuevas usan `usuarios_app`; las sesiones usan `sesiones_app`; los PDF nuevos usan `documentos_plataforma`.

Para conservar el modelo de datos de los paneles originales, los formularios, cuatro convocatorias, fases, horarios, descargas y actividad se guardan en el campo JSON de `estado_plataforma`. No son tablas normalizadas por entidad. El repositorio bloquea esa fila dentro de una transacción y verifica su versión para evitar reservas dobles y sobreasignación de cupos. Es una decisión para esta integración del proyecto académico; para mayor escala se puede migrar cada entidad a tablas propias.

## Seguridad y alcance

- Contraseñas derivadas con scrypt y sal aleatoria; nunca se devuelven al navegador.
- Cookies de sesión HttpOnly y SameSite=Strict, caducidad de ocho horas y tokens aleatorios cuyo hash se guarda en MySQL.
- El cambio de contraseña invalida las sesiones. Desactivar una cuenta impide nuevas acciones.
- El registro público siempre crea aspirantes. La primera cuenta de superadministrador se crea en la terminal; otras cuentas se administran desde su panel.
- PDF con cabecera `%PDF-`, extensión `.pdf` y máximo 5 MB. El formulario se guarda primero; si el PDF falla se informa expresamente y se puede reintentar mientras no haya revisión.
- La aplicación se sirve en `127.0.0.1`. Para publicarla hace falta HTTPS y añadir Secure a la cookie, además de adaptar el despliegue.
- El DPI valida formato y unicidad, no verifica la identidad de una persona. El correo no tiene verificación ni recuperación de contraseña por correo.
- Los datos de demostración del navegador no se importan automáticamente. Tampoco se habilitan las cuentas originales con contraseña `123`.

La librería jsPDF del dashboard original se carga desde su CDN para descargar formularios y reportes; esos botones requieren acceso a Internet.
