# Arquitectura del proyecto

El navegador consume la API del mismo servidor. Las rutas traducen HTTP a operaciones de negocio; los servicios validan permisos y transiciones; los repositorios ejecutan SQL parametrizado sobre un pool MySQL. Ningún archivo de configuración se publica por HTTP.

```text
publico/ → servidor/api/ → servidor/servicios/ → servidor/repositorios/ → MySQL
                                  ↑                       ↑
                           validaciones             configuracion/
```

## Responsabilidades

| Carpeta | Responsabilidad |
| --- | --- |
| `publico/` | Páginas, estilos, componentes y cliente HTTP |
| `servidor/api/` | Rutas, cuerpos de petición, respuestas y errores HTTP |
| `servidor/configuracion/` | Validación de variables y creación del pool |
| `servidor/servicios/` | Autenticación, permisos y proceso de postulación |
| `servidor/repositorios/` | Persistencia SQL, sesiones y transacciones |
| `base-datos/` | Migraciones ordenadas y catálogo inicial |
| `scripts/` | Migrar, verificar conexión, crear administrador y revisar sintaxis |
| `pruebas/` | Pruebas de negocio, API, repositorios, cliente e integración |
| `legado/` | Archivos anteriores conservados como referencia; no se ejecutan ni se publican |

## Datos y compatibilidad

`usuarios_app` es la única tabla de autenticación. Su columna `rol` diferencia aspirantes, administradores y superadministradores. `administradores` es una vista de consulta sin contraseñas; no es una segunda tabla de credenciales.

Las solicitudes actuales viven en `postulaciones`, los programas en `programas_beca`, las reservas en `horarios_entrevista` y las descargas en `descargas_formulario`. Los atributos del formulario y la lista de requisitos siguen usando JSON como datos de un registro; ya no se almacena toda la aplicación en un único documento.

Las tablas `estudiantes`, `becas`, `solicitudes` y `documentos` pertenecen al circuito histórico y se conservan. No deben confundirse con las postulaciones del panel. Los adjuntos actuales usan `documentos_plataforma`, con claves foráneas hacia usuario y postulación.

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
