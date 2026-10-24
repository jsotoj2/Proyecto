/* Coordinación de sesión, navegación y vistas comunes a los tres roles. */
const esc = valor => BecasData.escapar(valor ?? '');
let cuentaActual;
let navegando = false;

function mensaje(id, texto, error = false) {
    const elemento = document.getElementById(id);
    if (elemento) { elemento.textContent = texto; elemento.className = 'form-message ' + (error ? 'error' : 'success'); }
}

// Las marcas de tiempo llegan en UTC; se muestran en la hora de Guatemala.
function fechaHora(valor) {
    return new Date(valor).toLocaleString('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' });
}

function nombreRol(rol) {
    return { aspirante: 'Aspirante', admin: 'Administrador', superadmin: 'Superadministrador' }[rol] ?? rol;
}

function establecerUsuario(usuario) {
    cuentaActual = usuario;
    window.usuarioActual = { ...usuario, nombre: esc(usuario.nombre), correo: esc(usuario.correo) };
    window.sesionActual = { usuario: usuario.usuario, rol: usuario.rol };
    const insignia = document.getElementById('userBadge');
    if (insignia) insignia.innerHTML = `<div class="avatar">${esc(usuario.nombre.charAt(0))}</div><div><strong>${esc(usuario.nombre)}</strong><span>${nombreRol(usuario.rol)}</span></div>`;
}

async function cerrarSesion() {
    try { await BecasData.api('logout', {}); location.href = 'index.html'; }
    catch (error) { mostrarAviso(error.message); }
}

async function navegar(seccion) {
    if (navegando) return;
    navegando = true;
    Interfaz.mostrarCarga(true);
    try {
        await BecasData.cargar();
        if (seccion === 'cuenta') renderCuenta();
        else if (seccion === 'archivos') await renderArchivos();
        else if (sesionActual.rol === 'aspirante') AspiranteUI.render(seccion);
        else if (sesionActual.rol === 'admin') AdminUI.render(seccion, false);
        else SuperAdminUI.render(seccion);
        const menu = document.querySelector('.sidebar-menu');
        if (menu && !menu.querySelector('[data-archivos]')) {
            const boton = document.createElement('button');
            boton.dataset.archivos = 'true';
            boton.textContent = 'Documentos y registros';
            boton.onclick = () => navegar('archivos');
            menu.append(boton);
        }
        Interfaz.actualizarNavegacion(seccion);
    } catch (error) { mostrarAviso(error.message); }
    finally { navegando = false; Interfaz.mostrarCarga(false); }
}

async function renderArchivos() {
    const [documentos, previas] = await Promise.all([BecasData.api('documentos'), BecasData.api('previas')]);
    document.getElementById('pageTitle').textContent = 'Documentos y registros';
    const contenido = document.getElementById('mainContent');
    contenido.innerHTML = '<div class="page-header"><div><h1>Documentos y registros</h1><p>Consulta tus archivos y expedientes de procesos anteriores.</p></div></div>';
    if (!documentos.length && !previas.length) {
        contenido.insertAdjacentHTML('beforeend', '<section class="empty-state"><h2>Tu archivo está listo para crecer</h2><p>Todavía no hay documentos ni expedientes anteriores para esta cuenta.</p></section>');
    }
    for (const documento of documentos) {
        const parrafo = document.createElement('p');
        const enlace = document.createElement('a');
        enlace.className = 'document-link';
        enlace.href = '/api/plataforma/pdf/' + encodeURIComponent(documento.solicitud_id);
        enlace.textContent = 'Descargar PDF: ' + documento.nombre;
        parrafo.append(enlace);
        contenido.append(parrafo);
    }
    for (const solicitud of previas) {
        const tarjeta = document.createElement('section');
        tarjeta.className = 'panel';
        const titulo = document.createElement('h3');
        titulo.textContent = solicitud.expediente;
        const detalle = document.createElement('p');
        detalle.textContent = `${solicitud.postulante} · ${solicitud.beca} · ${solicitud.estado}`;
        tarjeta.append(titulo, detalle);
        if (solicitud.documento) {
            const enlace = document.createElement('a');
            enlace.href = '/api/plataforma/pdf-previo/' + encodeURIComponent(solicitud.expediente);
            enlace.textContent = 'Descargar ' + solicitud.documento;
            tarjeta.append(enlace);
        }
        contenido.append(tarjeta);
    }
}

function renderCuenta() {
    document.getElementById('pageTitle').textContent = 'Mi cuenta';
    document.getElementById('mainContent').innerHTML = `
        <div class="page-header"><h1>Mi cuenta</h1></div>
        <form id="cuentaForm" class="panel"><div class="form-grid">
            <div class="form-group"><label for="cuentaNombre">Nombre</label><input id="cuentaNombre" required minlength="2" maxlength="160" value="${esc(cuentaActual.nombre)}"></div>
            <div class="form-group"><label for="cuentaUsuario">Usuario</label><input id="cuentaUsuario" value="${esc(cuentaActual.usuario)}" disabled></div>
            <div class="form-group"><label for="cuentaCorreo">Correo</label><input id="cuentaCorreo" type="email" required maxlength="254" value="${esc(cuentaActual.correo)}"></div>
            <div class="form-group"><label for="cuentaRol">Rol</label><input id="cuentaRol" value="${nombreRol(cuentaActual.rol)}" disabled></div>
            <div class="form-group full"><label for="cuentaPassword">Nueva contraseña</label><input id="cuentaPassword" type="password" minlength="8" autocomplete="new-password" placeholder="Déjalo vacío para conservarla"></div>
        </div><button type="submit" class="btn-primary">Guardar cambios</button><p id="cuentaMensaje" class="form-message"></p></form>`;
    document.getElementById('cuentaForm').addEventListener('submit', evento => {
        evento.preventDefault();
        enviarFormulario(evento.currentTarget, guardarCuenta);
    });
}

async function guardarCuenta() {
    try {
        const password = document.getElementById('cuentaPassword').value;
        const resultado = await BecasData.api('cuenta', { nombre: document.getElementById('cuentaNombre').value, correo: document.getElementById('cuentaCorreo').value, password }, 'PATCH');
        establecerUsuario(resultado.usuario);
        if (password) { location.href = 'index.html'; return; }
        mensaje('cuentaMensaje', 'Datos actualizados correctamente.');
    } catch (error) { mensaje('cuentaMensaje', error.message, true); }
}

async function enviarFormulario(formulario, operacion) {
    const boton = formulario.querySelector('[type=submit]');
    if (boton.disabled) return;
    const texto = boton.textContent;
    boton.disabled = true;
    boton.textContent = 'Procesando…';
    formulario.setAttribute('aria-busy', 'true');
    try { await operacion(); }
    finally { boton.disabled = false; boton.textContent = texto; formulario.removeAttribute('aria-busy'); }
}

document.addEventListener('DOMContentLoaded', async () => {
    const acceso = document.getElementById('loginForm');
    acceso?.addEventListener('submit', evento => {
        evento.preventDefault();
        enviarFormulario(acceso, async () => {
            try {
                await BecasData.api('login', { usuario: document.getElementById('usuario').value, password: document.getElementById('password').value });
                location.href = 'dashboard.html';
            } catch (error) { mensaje('loginMensaje', error.message, true); }
        });
    });
    const registro = document.getElementById('registroForm');
    registro?.addEventListener('submit', evento => {
        evento.preventDefault();
        enviarFormulario(registro, async () => {
            try {
                const campos = { nombre: 'registroNombre', dpi: 'registroDpi', correo: 'registroCorreo', usuario: 'registroUsuario', password: 'registroPassword' };
                const datos = Object.fromEntries(Object.entries(campos).map(([campo, id]) => [campo, document.getElementById(id).value]));
                await BecasData.api('registro', datos);
                registro.reset();
                document.getElementById('usuario').value = datos.usuario;
                mensaje('registroMensaje', 'Cuenta creada. Cierra esta ventana e inicia sesión.');
            } catch (error) { mensaje('registroMensaje', error.message, true); }
        });
    });
    if (document.getElementById('dashboardPage')) {
        try {
            const { usuario } = await BecasData.api('sesion');
            establecerUsuario(usuario);
            await navegar('inicio');
        } catch (error) { mostrarAviso(error.message); }
    }
});
Object.assign(window, { cerrarSesion, navegar, guardarCuenta });
