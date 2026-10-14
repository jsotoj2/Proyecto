# API de la plataforma

Base: `/api/plataforma`. Respuestas JSON salvo descarga de PDF. La autenticación usa la cookie `becas_sesion`, con `HttpOnly`, `SameSite=Strict`, caducidad de ocho horas y `Secure` en producción. Las peticiones que modifican datos deben provenir de `APP_ORIGIN` cuando incluyen la cabecera `Origin`.

## Sesión y cuenta

| Método | Ruta | Datos / uso |
| --- | --- | --- |
| POST | `/registro` | `usuario`, `nombre`, `correo`, `dpi`, `password`. Siempre crea un aspirante |
| POST | `/login` | `usuario`, `password` |
| POST | `/logout` | Cierra la sesión actual |
| GET | `/sesion` | Usuario autenticado, sin hash |
| PATCH | `/cuenta` | `nombre`, `correo`, `password` opcional. Cambiar contraseña revoca todas sus sesiones |
| GET | `/estado` | Colecciones del panel y `version`; aspirantes solo reciben sus datos personales |

## Operaciones

Todas requieren sesión, un cuerpo JSON y `version` entera. La respuesta contiene el estado actualizado. Los permisos se comprueban en el servidor y se releen dentro de la transacción.

| Método | Ruta | Rol | Campos adicionales |
| --- | --- | --- | --- |
| POST | `/becas` | Superadmin | `nombre`, `descripcion`, `requisitos` como lista, `cupos` |
| POST | `/solicitudes` | Aspirante | `becaId`, `formulario` |
| POST | `/descargas` | Aspirante | `becaId` |
| POST | `/revisiones` | Admin / superadmin | `usuario`, `estado`, `comentario` |
| POST | `/horarios` | Admin / superadmin | `fecha`, `hora`, `modalidad` |
| POST | `/reservas` | Aspirante | `horarioId` |
| POST | `/entrevistas/completar` | Admin / superadmin | `usuario` |
| POST | `/resultados` | Admin / superadmin | `usuario`, `estado`, `comentario` |
| PATCH | `/cupos` | Superadmin | `becaId`, `cupos` |
| POST | `/usuarios` | Superadmin | `usuario` como objeto de cuenta; rol `admin` o `aspirante` |
| PATCH | `/usuarios/estado` | Superadmin | `usuario`, `activo` booleano |

Ejemplo de solicitud:

```json
{
  "version": 0,
  "becaId": 1,
  "formulario": {
    "edad": "20",
    "telefono": "55555555",
    "direccion": "Guatemala",
    "estudios": "Bachillerato",
    "promedio": "85",
    "motivo": "Continuar mi formación universitaria"
  }
}
```

Los estados de revisión y resultado admiten `aceptada` o `rechazada`. Las horas corresponden a Guatemala. No se permite reservar dos veces, superar cupos ni decidir una solicitud sin entrevista realizada.

## Documentos e histórico

- `GET /documentos`: documentos visibles para el usuario.
- `GET /pdf/:id`: descarga de un adjunto autorizado.
- `POST /pdf/:id`: cuerpo binario `application/pdf`, cabecera `X-File-Name` codificada con `encodeURIComponent`; máximo 5 MB y firma `%PDF-`. Solo se adjunta a una solicitud propia sin revisar.
- `GET /previas`: expedientes históricos visibles.
- `GET /pdf-previo/:expediente`: PDF histórico autorizado.
- `GET /api/salud`: comprueba acceso a MySQL, sin revelar configuración.

La firma del PDF verifica el tipo básico; no sustituye un análisis antivirus. La solicitud y su adjunto se guardan en operaciones independientes: si falla el adjunto, la interfaz informa que la solicitud sí quedó guardada.

## Errores y compatibilidad

Formato: `{ "error": "Mensaje en español", "identificador": "…" }` para errores centralizados. Códigos: 400 validación, 401 sesión, 403 permisos/origen, 404 recurso, 409 conflicto, 413 tamaño, 415 formato, 429 límite de intentos, 500 fallo inesperado y 503 indisponibilidad conocida de conexión.

El cliente no reintenta automáticamente escrituras. Tras un timeout, consulta el estado antes de repetir. `POST /accion` se conserva temporalmente con cabecera `Deprecation: true`; el frontend nuevo usa las rutas explícitas. `POST /cuenta` se acepta por compatibilidad. El antiguo circuito público `/api/solicitudes` se retira; el histórico sigue accesible mediante las rutas autenticadas del panel.

El límite de intentos de acceso es de 15 por minuto e IP en cada proceso. Un despliegue con varios procesos necesita un almacén compartido para ese límite. No se confía automáticamente en `X-Forwarded-For`.
