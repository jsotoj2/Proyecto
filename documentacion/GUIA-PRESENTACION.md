# Cómo presentar la arquitectura de la plataforma de becas

Duración sugerida: 7–8 minutos. Usa siete diapositivas y un ejemplo que recorra las capas.

## Frase principal para memorizar

> Nuestro sistema usa arquitectura por capas dentro de un monolito. Presentación recibe y muestra información; aplicación coordina los pasos; negocio establece las reglas; y datos conserva la información en MySQL.

## Diapositiva 1 · Qué problema resuelve · 40 segundos

**En pantalla:** Plataforma de becas; aspirantes, administradores y superadministradores; solicitud → revisión → entrevista → decisión.

**Qué decir:** “La plataforma permite que un aspirante solicite una beca y que los administradores gestionen su evaluación. El proceso incluye permisos, cupos y decisiones que debemos aplicar de forma consistente. Por eso organizamos el código según sus responsabilidades.”

## Diapositiva 2 · Arquitectura general · 60 segundos

**En pantalla:** `ESQUEMA-ARQUITECTURA.png`.

**Qué decir:** “Estas son cuatro capas lógicas del código. Presentación incluye React y la entrada HTTP. Aplicación coordina el caso de uso y consulta tanto las reglas como los repositorios. Negocio trabaja con objetos y no accede a MySQL. Datos ejecuta las consultas. La infraestructura proporciona correo, configuración y seguridad.”

**Señala:** Aplicación llama por separado a negocio y datos. Las flechas representan llamadas; las respuestas regresan al usuario. No son cuatro servidores.

## Diapositiva 3 · Presentación · 50 segundos

**En pantalla:** `cliente/src/` y `servidor/presentacion/`; frase “Recibe y muestra”.

**Qué decir:** “React organiza las pantallas por rol y envía peticiones a la API. Las rutas traducen URL y método HTTP a una operación. Por ejemplo, POST resultados se convierte en fase4. Esta capa maneja JSON, cookies y códigos HTTP, pero no decide si una beca cumple las reglas.”

**Mostrar:** `servidor/presentacion/rutas.js`, tabla `operaciones`.

## Diapositiva 4 · Aplicación y negocio · 90 segundos

**En pantalla:** Aplicación = “Coordina”; negocio = “Decide”.

**Qué decir:** “Aplicación define el orden: abre una transacción, carga información, comprueba la versión, aplica reglas y guarda el resultado con auditoría. Negocio contiene las condiciones del proceso. Por ejemplo, una solicitud superior a Q10,000 requiere un segundo administrador. Podemos probar esa regla sin iniciar HTTP ni conectarnos a MySQL.”

**Mostrar:** `aplicacion/plataformaServicio.js`, método `accion`; `negocio/solicitudesReglas.js`, métodos `resultado` y `segundaAprobacion`.

**Idea clave:** Coordinar una aprobación y determinar cuándo necesita otro aprobador son responsabilidades distintas.

## Diapositiva 5 · Datos e infraestructura · 60 segundos

**En pantalla:** Repositorios → MySQL; al costado, correo y seguridad.

**Qué decir:** “Los repositorios traducen el modelo a tablas y usan consultas parametrizadas. Si todos los cambios se completan, confirman la transacción; si falla un paso, la revierten. Los correos pendientes se guardan junto con la decisión y se envían después. Un fallo del correo no deshace una aprobación.”

**Mostrar:** `datos/usuariosRepositorio.js`, método `transaccion`; `datos/plataformaRepositorio.js`, método `guardarEstado`.

## Diapositiva 6 · Ejemplo completo · 90 segundos

**En pantalla:** Aprobar Q15,000: pantalla → API → aplicación → reglas → guardado → respuesta.

**Qué decir:** “El administrador aprueba una solicitud de Q15,000. La API reconoce la acción. Aplicación carga los datos. Negocio verifica revisión, entrevista y cupos; como supera Q10,000, establece pendiente de segunda aprobación. Datos conserva el cambio y la auditoría en una transacción. El panel muestra el nuevo estado. Otro administrador debe completar la aprobación.”

**Rechazo para explicar:** Si el mismo administrador intenta realizar ambas aprobaciones, `segundaAprobacion()` lo rechaza y esa decisión no se guarda.

**Demo opcional:** Ejecuta `npm run demo` antes de exponer. Con `admin`, aprueba la solicitud de Sofía de Q15,000; cierra sesión e inicia como `admin2` para completar la segunda aprobación. Diego ya está pendiente de segunda aprobación por `admin`, por si necesitas un ejemplo listo.

## Diapositiva 7 · Beneficios y límites · 60 segundos

**En pantalla:** Claridad; pruebas; mantenimiento; evolución gradual.

**Qué decir:** “Podemos localizar cada cambio: una pantalla en presentación, una regla en negocio y una consulta en datos. Las pruebas comprueban comportamientos y límites entre capas. La solución sigue siendo un monolito y conserva el bloqueo global. Si aumenta el uso simultáneo, podemos añadir paginación y versiones por solicitud.”

**Cierre:** “La decisión busca que cada parte tenga una responsabilidad comprensible y comprobable.”

## Recorrido del código en dos minutos

1. `servidor/iniciar.js`: cómo se construyen y conectan los objetos.
2. `presentacion/rutas.js`: traducción de `POST /resultados` a `fase4`.
3. `aplicacion/plataformaServicio.js`: coordinación de transacción, reglas y guardado.
4. `negocio/solicitudesReglas.js`: condición de Q10,000 y segundo aprobador.
5. `datos/plataformaRepositorio.js`: una consulta parametrizada.
6. `npm test`: 35 pruebas del servidor y 13 del cliente en esta entrega.

## Preguntas que podrían hacerte

**¿Por qué arquitectura por capas?** Separa interacción, coordinación, reglas y persistencia. Coincide con las necesidades del proyecto y facilita localizar los cambios.

**¿Son cuatro aplicaciones o servidores?** No. Son cuatro responsabilidades lógicas. React corre en el navegador, Node.js publica API e interfaz compilada, y MySQL almacena datos.

**¿Por qué negocio no llama a datos?** Aplicación obtiene los datos y se los entrega a negocio. Las reglas no necesitan saber cómo se consultaron ni cómo se guardarán.

**¿Aplicación y negocio no son lo mismo?** Aplicación ordena los pasos; negocio define qué está permitido y cómo cambia una solicitud.

**¿Es MVC?** La descripción principal es arquitectura por capas. React usa componentes y estado; no estamos imponiendo MVC clásico al sistema completo.

**¿Cambiar MySQL sería inmediato?** No. Los repositorios aíslan gran parte del SQL, pero cambiar el motor exige adaptar consultas, transacciones, migraciones y pruebas.

**¿Cómo evitan aprobar sin permiso desde el navegador?** Las reglas del servidor comprueban roles y aplicación consulta la cuenta antes de modificar el estado. Ocultar un botón solo ayuda a navegar.

**¿Las pruebas garantizan producción?** No. Se aprobaron pruebas automatizadas y compilación; falta comprobar MySQL real, SMTP y despliegue.

**¿Qué mejorarías después?** Consultas por pantalla, paginación, versiones por solicitud y dividir el repositorio principal si crece.

## Antes de exponer

- Ensaya con una copia de demostración: `npm ci`, `npm test` y `npm run demo`.
- Abre `http://localhost:4173`. Contraseña de todas las cuentas de demo: `123`. Los cambios solo viven en memoria.
- Deja abiertos el esquema y los archivos del recorrido.
- Si la demo falla en el equipo de presentación, explica el ejemplo con el esquema y el código de la regla.
- No afirmes que se probó MySQL real ni que se resolvió la escalabilidad. Consulta `VERIFICACION.md`.
