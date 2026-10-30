/*
 * Modo demostración: la API real con datos en memoria y la interfaz compilada, sin MySQL ni archivo .env.
 * Recupera las cuentas del demo original (contraseña 123) y agrega solicitudes en distintas etapas
 * para recorrer todas las pantallas. Los cambios se pierden al detener el proceso.
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { RepositorioPrueba } from '../pruebas/soporte.js';
import { AutenticacionServicio, hashPassword } from '../servidor/servicios/autenticacionServicio.js';
import { PlataformaServicio } from '../servidor/servicios/plataformaServicio.js';
import { crearRutas } from '../servidor/api/rutas.js';
import { crearAplicacion } from '../servidor/api/aplicacion.js';
import { crearTransporteArchivo } from '../servidor/correo/transportes.js';
import { crearDespachador } from '../servidor/correo/despachador.js';

const PUERTO = 4173;
const ORIGEN = `http://localhost:${PUERTO}`;
const CONTRASENA = '123';

const indice = new URL('../cliente/dist/index.html', import.meta.url);
// Con "npm run dev:demo" la interfaz la sirve Vite, así que la compilación solo se avisa.
try { await fs.access(indice); } catch {
    console.warn('Aviso: falta cliente/dist. Usa "npm run demo" para compilar, o abre Vite con "npm run dev:demo".');
}

const dia = desplazamiento => new Date(Date.now() + desplazamiento * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' });
const pendiente = { estado: 'pendiente', comentario: '' };
const sinEntrevista = { estado: 'pendiente', fecha: '', hora: '', modalidad: '' };
const sinResultado = { estado: 'pendiente', comentario: '', aprobadoPor: '' };
const formulario = (nombre, monto, promedio) => ({
    nombre, edad: '20', telefono: '55551234', direccion: 'Zona 1, Ciudad de Guatemala', estudios: 'Bachillerato en Ciencias y Letras',
    promedio, monto, motivo: 'Deseo continuar mis estudios universitarios y aportar al desarrollo de mi comunidad.'
});

const usuarios = [
    { id: 1, usuario: 'alejandro', nombre: 'Alejandro Baten', correo: 'alejandro@email.com', dpi: '2999123450101', rol: 'aspirante' },
    { id: 2, usuario: 'maria', nombre: 'María López', correo: 'maria@email.com', dpi: '2874567890101', rol: 'aspirante' },
    { id: 3, usuario: 'admin', nombre: 'Carlos Administrador', correo: 'admin@becas.gt', dpi: '', rol: 'admin' },
    { id: 4, usuario: 'superadmin', nombre: 'Administrador General', correo: 'superadmin@becas.gt', dpi: '', rol: 'superadmin' },
    { id: 5, usuario: 'admin2', nombre: 'Lucía Revisora', correo: 'admin2@becas.gt', dpi: '', rol: 'admin' },
    { id: 6, usuario: 'luis', nombre: 'Luis Gómez', correo: 'luis@email.com', dpi: '3011223340101', rol: 'aspirante' },
    { id: 7, usuario: 'sofia', nombre: 'Sofía Ramírez', correo: 'sofia@email.com', dpi: '3022334450101', rol: 'aspirante' },
    { id: 8, usuario: 'diego', nombre: 'Diego Morales', correo: 'diego@email.com', dpi: '3033445560101', rol: 'aspirante' }
];

const solicitudes = [
    // María: formulario aprobado, puede reservar su entrevista.
    { id: 1, usuario: 'maria', dpi: '2874567890101', becaId: 2, fechaFormulario: dia(-6), formularioEnviado: true, formulario: formulario('María López', '6000', '91'),
        fase2: { estado: 'aceptada', comentario: 'Tu formulario cumple con los requisitos establecidos.' }, entrevista: sinEntrevista, fase4: sinResultado },
    // Luis: pendiente de revisión.
    { id: 2, usuario: 'luis', dpi: '3011223340101', becaId: 1, fechaFormulario: dia(-2), formularioEnviado: true, formulario: formulario('Luis Gómez', '8000', '84'),
        fase2: pendiente, entrevista: sinEntrevista, fase4: sinResultado },
    // Sofía: entrevista realizada, lista para la decisión final (monto mayor de Q10,000).
    { id: 3, usuario: 'sofia', dpi: '3022334450101', becaId: 4, fechaFormulario: dia(-12), formularioEnviado: true, formulario: formulario('Sofía Ramírez', '15000', '95'),
        fase2: { estado: 'aceptada', comentario: 'Tu formulario cumple con los requisitos establecidos.' },
        entrevista: { estado: 'realizada', fecha: dia(-3), hora: '10:00', modalidad: 'Presencial' }, fase4: sinResultado },
    // Diego: aprobado por "admin", espera la segunda aprobación de otro administrador.
    { id: 4, usuario: 'diego', dpi: '3033445560101', becaId: 3, fechaFormulario: dia(-15), formularioEnviado: true, formulario: formulario('Diego Morales', '12000', '88'),
        fase2: { estado: 'aceptada', comentario: 'Tu formulario cumple con los requisitos establecidos.' },
        entrevista: { estado: 'realizada', fecha: dia(-5), hora: '15:30', modalidad: 'Virtual' },
        fase4: { estado: 'pendiente_aprobacion', comentario: 'Has sido seleccionado para la beca solicitada.', aprobadoPor: 'admin' } }
];

const repositorio = new RepositorioPrueba();
const hash = await hashPassword(CONTRASENA);
repositorio.usuarios = usuarios.map(usuario => ({ ...usuario, activo: true, password_hash: hash }));
repositorio.datos = {
    becas: JSON.parse(await fs.readFile(new URL('../base-datos/catalogo-inicial.json', import.meta.url), 'utf8')).becas,
    solicitudes,
    horarios: [
        { id: 1, fecha: dia(-3), hora: '10:00', modalidad: 'Presencial', ocupado: true, usuario: 'sofia' },
        { id: 2, fecha: dia(-5), hora: '15:30', modalidad: 'Virtual', ocupado: true, usuario: 'diego' },
        { id: 3, fecha: dia(2), hora: '09:00', modalidad: 'Presencial', ocupado: false, usuario: '' },
        { id: 4, fecha: dia(2), hora: '11:30', modalidad: 'Virtual', ocupado: false, usuario: '' },
        { id: 5, fecha: dia(3), hora: '14:00', modalidad: 'Presencial', ocupado: false, usuario: '' }
    ],
    descargas: [{ usuario: 'maria', becaId: 2, fecha: dia(-6) }, { usuario: 'sofia', becaId: 4, fecha: dia(-12) }],
    actividad: [
        { texto: 'Carlos Administrador guardó la decisión final de diego.', fecha: dia(-1) },
        { texto: 'Luis Gómez envió su formulario.', fecha: dia(-2) },
        { texto: 'Carlos Administrador revisó el formulario de maria.', fecha: dia(-4) }
    ]
};
repositorio.avisos = [{ id: 1, usuario: 'maria', solicitudId: 1, mensaje: 'Tu formulario fue aprobado. Ya puedes reservar tu entrevista.', fecha: new Date().toISOString(), leida: false }];

// La demo nunca envía correos reales: cada aviso se guarda como HTML en correos-locales/demo.
const CARPETA_CORREOS = new URL('../correos-locales/demo/', import.meta.url);
const despachador = crearDespachador({ repositorio, transporte: crearTransporteArchivo(fileURLToPath(CARPETA_CORREOS)), intervaloMs: 5000 });
despachador.iniciar();
const plataforma = new PlataformaServicio(repositorio, { urlPanel: ORIGEN, alEncolarCorreos: () => despachador.procesar() });
const rutas = crearRutas({ autenticacion: new AutenticacionServicio(repositorio), plataforma, repositorio, origen: ORIGEN });
http.createServer(crearAplicacion({ rutas, comprobarConexion: async () => {} }))
    .listen(PUERTO, '127.0.0.1', () => {
        console.log(`\nDemo de Becas Nacionales en ${ORIGEN}  (datos en memoria, sin MySQL)\n`);
        console.table([
            { usuario: 'alejandro', rol: 'Aspirante', situación: 'Sin solicitud: puede llenar el formulario' },
            { usuario: 'maria', rol: 'Aspirante', situación: 'Formulario aprobado: puede reservar entrevista' },
            { usuario: 'admin', rol: 'Administrador', situación: 'Revisa, entrevista y decide' },
            { usuario: 'admin2', rol: 'Administrador', situación: 'Puede dar la segunda aprobación de diego' },
            { usuario: 'superadmin', rol: 'Superadministrador', situación: 'Usuarios, becas, cupos y estadísticas' }
        ]);
        console.log(`Contraseña de todas las cuentas: ${CONTRASENA}\nLos correos de notificación se guardan en correos-locales/demo/ (ábrelos en el navegador).\nDetén la demo con Ctrl+C; los cambios no se guardan.\n`);
    })
    .on('error', error => {
        console.error(error.code === 'EADDRINUSE' ? `El puerto ${PUERTO} está ocupado. Cierra la otra demo e inténtalo de nuevo.` : error.message);
        process.exitCode = 1;
    });
