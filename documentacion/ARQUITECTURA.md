# Arquitectura del proyecto

El navegador consume la API del mismo servidor. Las rutas traducen HTTP a operaciones de negocio; los servicios validan permisos y transiciones; los repositorios ejecutan SQL parametrizado sobre un pool MySQL. Ningún archivo de configuración se publica por HTTP.

```text
cliente/ → servidor/api/ → servidor/servicios/ → servidor/repositorios/ → MySQL
                                  ↑                       ↑
                           validaciones             configuracion/
```

## Responsabilidades

| Carpeta | Responsabilidad |
| --- | --- |
| `cliente/` | Interfaz React con Vite: rutas por rol, componentes, alertas, cliente HTTP y constancia PDF. `npm run build` genera `cliente/dist/`, que publica el servidor |
| `servidor/api/` | Rutas, cuerpos de petición, respuestas y errores HTTP |
| `servidor/configuracion/` | Validación de variables y creación del pool |
| `servidor/servicios/` | Autenticación, permisos y proceso de postulación |
| `servidor/repositorios/` | Persistencia SQL, sesiones y transacciones |
| `base-datos/` | Migraciones ordenadas y catálogo inicial |
| `scripts/` | Migrar, verificar conexión, crear administrador y revisar sintaxis |
| `pruebas/` | Pruebas de negocio, API, repositorios, cliente e integración |
| `legado/` | Archivos anteriores conservados como referencia; no se ejecutan ni se publican |

## Interfaz

- **Rutas por rol.** React Router define `/acceso`, `/registro` y `/panel/...`. Las protecciones de `cliente/src/rutas/` solo ordenan la navegación: cada permiso se vuelve a comprobar en el servidor. El servidor devuelve `index.html` para cualquier ruta sin extensión, así que los enlaces directos funcionan.
- **Estado.** `api/almacenEstado.js` guarda la respuesta de `GET /estado`, reutiliza lecturas de menos de 15 segundos y envía la `version` en cada escritura; ante un 409 recarga el estado. React escapa el contenido al mostrarlo, por lo que el cliente ya no transforma los textos.
- **Alertas.** `componentes/alertas/alertas.js` centraliza las confirmaciones, los éxitos, los errores y los comentarios obligatorios con SweetAlert2. `<Alerta>` muestra los mensajes dentro de la página.
- **Formulario y constancia.** El aspirante completa en línea todos los datos que antes pedía el PDF impreso. Al enviar la solicitud puede descargar una constancia PDF (`utilidades/constanciaPdf.js`) con esa información; los administradores generan la misma constancia desde el expediente.
- **Diseño.** Los colores, espacios y tipografía salen de `estilos/tokens.css`; cada componente usa su propio CSS Module.

## Datos y compatibilidad

El esquema, sus relaciones y las reglas que garantiza están en [BASE-DE-DATOS.md](BASE-DE-DATOS.md). En resumen: `usuarios` es la única tabla de cuentas (la columna `rol` distingue los tres perfiles), `solicitudes` guarda las cuatro etapas con el formulario en columnas, y todas las relaciones usan el `id`.

`PlataformaRepositorio` traduce entre esas tablas y el objeto de estado que usa el servicio (`becas`, `solicitudes`, `horarios`, `descargas`, `actividad`). Las reglas de negocio no dependen de cómo se guardan los datos.

## Concurrencia

Cada operación de negocio incluye la versión leída por el cliente. El servidor bloquea `control_plataforma` dentro de una transacción, comprueba esa versión y aplica los cambios. Un cliente desactualizado recibe HTTP 409. La conexión se libera tanto al confirmar como al revertir.

Este bloqueo global conserva el contrato del frontend y evita reservas o cupos inconsistentes. Es una decisión de compatibilidad para el volumen actual, no una arquitectura de alta concurrencia. Si crece el tráfico, el siguiente cambio es versionar cada solicitud y bloquear únicamente el horario o programa implicado.

Las lecturas del estado son consistentes y se cachean en el navegador durante 15 segundos. Los conflictos fuerzan una nueva lectura. El repositorio escribe únicamente los registros modificados; las lecturas del panel todavía agregan las colecciones completas. La paginación y las consultas específicas por vista quedan como mejora posterior para grandes volúmenes.

## Convenciones

- Código y documentación propios en español; se conservan nombres del lenguaje, librerías, métodos HTTP y contratos existentes como `login`, `password` y `admin`.
- Los comentarios explican decisiones, límites o reglas; no repiten cada instrucción.
- No se introduce SQL en servicios ni lógica de permisos en el navegador.
- Los datos sensibles no se registran en consola. Los errores inesperados incluyen un identificador de seguimiento.
- No se cambian migraciones ya aplicadas: se añade un archivo nuevo.
- Los handlers existentes de las vistas usan funciones globales por compatibilidad. Las operaciones y la navegación ya no se sustituyen dinámicamente.

## Referencias técnicas

- [Pool y consultas preparadas de mysql2](https://sidorares.github.io/node-mysql2/docs/examples/connections/create-pool).
- [Servidor HTTP de Node.js](https://nodejs.org/api/http.html).
