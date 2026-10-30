# Verificación de la reorganización por capas

Fecha: 30 de octubre de 2026. Entorno: Windows, Node.js v24.21.0.

## Resultados

- `npm test`: 35 pruebas del servidor y 13 del cliente aprobadas; 48 en total.
- `npm run verificar`: sintaxis del JavaScript activo comprobada.
- `npm run build`: interfaz React compilada con Vite.
- `node scripts/demo.js`: inicio del servidor de demo confirmado; detenido después de comprobarlo.
- Manejadores HTTP probados con streams, incluyendo el identificador dinámico de la ruta de comités.
- Prueba de dependencias para límites entre capas, ausencia de imports de infraestructura en negocio y SQL fuera de datos.
- Nuevas pruebas de documentos propios, acceso ajeno rechazado, solicitudes revisadas, cuentas desactivadas, rollback, permisos de comités y asignación repetida.

Se usaron dependencias incluidas en el ZIP original para estas comprobaciones. El ZIP de entrega excluye `node_modules`; en destino se debe ejecutar `npm ci`.

## Pendiente en destino

- `npm run test:integracion` con MySQL real: no se ejecutó sin una base de pruebas configurada.
- Aplicación real de `005-comites.sql`: conectada al migrador, sin ejecución sobre datos del usuario en esta sesión.
- Confirmar SMTP real, HTTPS y credenciales de despliegue.
- Inspección visual manual en navegador. La interfaz compiló y sus 13 pruebas pasaron; no hubo revisión visual en esta entrega.

El entorno restringió las conexiones de las herramientas de línea de comandos a localhost; no se certifica una prueba HTTP a través de sockets. Las pruebas de API usaron streams y el arranque de demo se comprobó por separado.

## Decisiones conservadas

Se conservan los contratos de los flujos anteriores, el estado completo, la versión global, la caché del cliente y el bloqueo de `control_plataforma`. El trabajo mejora la separación y comprensión del código; no demuestra capacidad de alta concurrencia.

Los documentos históricos de `legado/` corresponden a implementaciones anteriores. Esta verificación describe únicamente la copia reorganizada.
