# Ejecutar la aplicación completa con Aiven

## Si ya tenías la conexión configurada

Conserva `Backend/.env`, `Backend/certificados/ca.pem` y las dependencias instaladas. No copies otra vez `.env.example` encima de tus credenciales.

En la terminal que ejecuta el servidor, deténlo con Ctrl+C. Desde `Backend`:

```powershell
npm.cmd start
```

El servidor prepara automáticamente las nuevas tablas sin borrar las cuatro anteriores. Abre http://localhost:3000 y usa “Crear cuenta de aspirante”; después inicia sesión con el usuario y contraseña elegidos. Para recuperar el acceso a tus expedientes anteriores, registra la cuenta con el mismo DPI que se usó en la solicitud anterior.

## Primera cuenta de superadministrador

Desde otra terminal en `Backend`:

```powershell
npm.cmd run crear-admin
```

El comando pide usuario, nombre, correo y una contraseña de mínimo ocho caracteres. Oculta la contraseña mientras escribes y solicita confirmación. Solo permite crear la primera cuenta de superadministrador. Las cuentas posteriores de administrador y aspirante se crean desde su panel de Usuarios. Al crear un aspirante allí también debes colocar su DPI de 13 dígitos.

Las cuentas antiguas `admin / 123`, `superadmin / 123` y demás usuarios ficticios no se habilitan en MySQL.

## Primera instalación en otra computadora

1. Instala Node.js LTS, versión 22 o posterior.
2. Desde `Backend`, ejecuta `npm.cmd ci`.
3. Copia `.env.example` como `.env` y completa host, puerto real de Aiven, usuario, contraseña y `DB_NAME="becas_app"`.
4. Guarda la CA de Aiven en `Backend/certificados/ca.pem`; conserva `DB_SSL=true`.
5. Ejecuta `npm.cmd run iniciar-db`, luego `npm.cmd start`.

No se suben a GitHub `.env`, certificados ni `node_modules`. Cada compañero debe configurar su propia copia local con los datos autorizados del servicio.

## Recorrido para verificar

1. Registra una cuenta de aspirante y entra.
2. En Fase 1, selecciona una convocatoria, completa el formulario y adjunta un PDF si corresponde.
3. Cierra sesión y vuelve a entrar: el formulario debe seguir disponible.
4. Desde una cuenta administradora aprueba Fase 2 y crea un horario futuro.
5. Desde el aspirante reserva el horario en Fase 3.
6. Desde el administrador marca la entrevista como realizada y decide Fase 4.
7. Revisa el resultado desde Estado de beca.
8. Desde el superadministrador revisa Usuarios, Cupos y Estadísticas.
9. En “Documentos y registros anteriores” descarga el PDF y consulta el expediente que guardaste antes de la recuperación.

## Consultas de comprobación en DBeaver

```sql
SELECT usuario, nombre, correo, dpi, rol, activo FROM becas_app.usuarios_app;
SELECT version, JSON_LENGTH(datos, '$.solicitudes') AS solicitudes FROM becas_app.estado_plataforma;
SELECT solicitud_id, nombre, OCTET_LENGTH(contenido) AS bytes FROM becas_app.documentos_plataforma;
SELECT expediente, nombre, OCTET_LENGTH(contenido) AS bytes FROM becas_app.documentos;
```

No consultes ni compartas `password_hash` o tokens de sesión. Si la página sigue mostrando la versión anterior, reinicia el servidor y recarga con Ctrl+F5.
