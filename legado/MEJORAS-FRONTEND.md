# Mejoras del frontend de Becas Nacionales

## Integración
El ZIP incluye el proyecto completo y conserva su estructura. Para integrar los cambios en tu repositorio, copia únicamente la carpeta Frontend sobre la existente, conservando una copia de respaldo. No se modificó Backend, Datos ni Negocio.

Archivos modificados: Frontend/index.html, Frontend/dashboard.html, Frontend/js/app.js y Frontend/js/archivos.js.
Archivos nuevos: Frontend/css/mejoras.css y Frontend/js/mejoras.js.
Las nuevas hojas y scripts ya están enlazados en las páginas HTML.

## Cambios
- Identidad visual verde, tipografía, espaciado, tarjetas, tablas y formularios compartidos por los tres roles.
- Corrección del espaciado del contenedor dashboard-content.
- Menú activo por sección y menú móvil desplegable, con cierre mediante Escape o el fondo.
- Acceso y registro adaptados a dispositivos pequeños; opción de mostrar la contraseña.
- Diálogo de registro con foco inicial, retorno del foco y navegación con Tab.
- Etiquetas y mensajes accesibles, enlaces para saltar al contenido y preferencia de movimiento reducido.
- Indicador de carga en navegación, estado de procesamiento en acceso/registro y avisos de errores sin ventanas bloqueantes en app.js y archivos.js.
- Acceso directo a explorar becas desde el inicio del aspirante.

## Ejecución real
Desde Backend, instala dependencias con npm install. Configura Backend/.env siguiendo .env.example con tus datos de MySQL. Usa los procedimientos de inicialización de base de datos del proyecto cuando corresponda. Ejecuta npm start y abre http://localhost:3000.
No basta abrir index.html como archivo: la autenticación y los datos requieren el backend.

## Verificación
Se verificaron en Chrome las pantallas de aspirante, administrador y superadministrador, todas las secciones del menú, estado activo, acceso con credenciales rechazadas, recuperación del botón de envío, mostrar contraseña, foco del registro, cierre por Escape y menú móvil a 390 px. No se detectaron errores JavaScript ni desbordamiento horizontal en los inicios móviles.
Las pruebas usan respuestas API simuladas exclusivamente en el verificador externo; no se incorporaron datos de prueba a la aplicación. La integración real con MySQL, las operaciones de escritura y la descarga de PDF requieren verificación en el entorno configurado.
