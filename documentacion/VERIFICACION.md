# Verificación de la entrega

Fecha: 14 de octubre de 2026.

## Comprobado

- 13 pruebas automatizadas aprobadas con `node:test`: permisos, contraseñas scrypt, sesiones, validación, etapas, conflictos de versión, transacciones, consultas parametrizadas, configuración y cliente HTTP.
- Manejadores HTTP probados mediante streams inyectados: sesión requerida, origen, JSON, tamaño máximo, rutas explícitas y protección de archivos privados. Esta comprobación no requiere abrir un puerto.
- Sintaxis de todos los archivos JavaScript activos comprobada.
- Interfaz comprobada con Chromium y API simulada: 8 vistas de aspirante, 8 de administrador y 11 de superadministrador, a 390, 768 y 1440 píxeles.
- Registro modal, mostrar contraseña, navegación, menú móvil y siguiente paso comprobados sin errores JavaScript ni desbordamientos horizontales.

## Pendiente de ejecutar en el entorno de destino

- Instalar las dependencias con `npm ci`.
- Ejecutar la suite con Node.js 22 o superior. La instalación disponible para las pruebas de código de esta sesión fue Node.js 20.20.0.
- Probar la conexión con credenciales reales y aplicar las migraciones primero sobre una copia de la base.
- Ejecutar `npm run test:integracion` sobre una base de pruebas vacía.
- Crear el primer administrador con el asistente o con el SQL generado.
- Verificar login y operaciones del navegador contra el servidor real y revisar HTTPS en el despliegue.

La descarga de paquetes falló por resolución de red. La política de aprobación rechazó el intento de ejecutar la instalación fuera del entorno restringido. No se sustituyó mysql2 por otro conector ni se modificaron datos reales.

La prueba de integración incluida verifica migraciones repetibles, persistencia, sesión y dos escrituras concurrentes con la misma versión. Está preparada, pero **no fue ejecutada** durante esta entrega. Las pruebas de repositorios unitarias usan dobles; no certifican el comportamiento de un MySQL real.
