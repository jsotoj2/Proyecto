# Proyecto de becas con arquitectura por capas

El ZIP `Proyecto-Arquitectura-Capas.zip` contiene una copia reorganizada del proyecto entregado. Extrae la carpeta `Proyecto-Capas` y ábrela en tu editor.

## Probar la demostración

En una terminal ubicada dentro de `Proyecto-Capas`:

```powershell
npm ci
npm test
npm run demo
```

Requiere Node.js 22 o superior y conexión a Internet para instalar las dependencias. La demo no necesita MySQL. Abre `http://localhost:4173`; usa `admin`, `admin2`, `superadmin`, `alejandro` o `maria`, con contraseña `123`. Esta contraseña pertenece exclusivamente al modo demo. Los cambios se pierden al detenerlo con Ctrl+C.

## Usar una base MySQL

Consulta el README dentro del ZIP. Copia `.env.example` a `.env`, configura las credenciales y ejecuta:

```powershell
npm run probar-db
npm run migrar
npm run build
npm start
```

La base debe existir. Para una instalación nueva, sigue además los pasos de creación de base y administrador del README. El migrador ahora incluye `005-comites.sql`; conserva las migraciones anteriores.

## Entender y presentar

- `ARQUITECTURA.md`: distribución de carpetas, responsabilidades, ejemplo completo y límites.
- `ESQUEMA-ARQUITECTURA.png`: imagen para insertar en una diapositiva.
- `GUIA-PRESENTACION.md`: siete diapositivas sugeridas, qué decir, recorrido del código y preguntas frecuentes.
- `VERIFICACION.md`: 48 pruebas aprobadas y comprobaciones pendientes en el entorno de destino.

Estos materiales también están dentro de `Proyecto-Capas/documentacion/`.

Frase para explicar: **Presentación muestra; aplicación coordina; negocio decide; datos guarda.**

Aplicación consulta negocio y datos por separado. Infraestructura proporciona seguridad, configuración y correo. Son responsabilidades del código dentro de un monolito.

## Alcance de la entrega

Se reorganizó el servidor, se actualizaron sus consumidores, se separaron las reglas y se corrigió la integración de comités y documentos. El bloqueo y la versión global se conservan. Comités tiene API, sin pantalla nueva. Se conservó `legado/` como referencia histórica fuera del flujo activo.

El ZIP incluye fuentes, pruebas, migraciones y documentación. Excluye dependencias instaladas, compilación generada y configuración local. El ZIP original y GitHub no fueron modificados.
