/* Interacciones de presentación; las operaciones siguen usando BecasData. */
(() => {
  const modal = document.getElementById('modalRegistro');
  let focusAnterior;
  const abrirOriginal = window.abrirRegistro;
  const cerrarOriginal = window.cerrarRegistro;
  window.abrirRegistro = () => {
    focusAnterior = document.activeElement;
    abrirOriginal();
    document.body.classList.add('modal-open');
    document.getElementById('registroNombre')?.focus();
  };
  window.cerrarRegistro = () => {
    cerrarOriginal();
    document.body.classList.remove('modal-open');
    focusAnterior?.focus();
  };
  modal?.addEventListener('click', e => { if (e.target === modal) window.cerrarRegistro(); });
  const toggle = document.getElementById('menuToggle');
  const backdrop = document.getElementById('menuBackdrop');
  function menu(abierto) {
    document.getElementById('sidebar')?.classList.toggle('is-open', abierto);
    toggle?.setAttribute('aria-expanded', String(abierto));
    toggle?.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (backdrop) backdrop.hidden = !abierto;
    if (abierto) document.querySelector('.sidebar-menu button')?.focus();
  }
  toggle?.addEventListener('click', () => menu(toggle.getAttribute('aria-expanded') !== 'true'));
  backdrop?.addEventListener('click', () => { menu(false); toggle?.focus(); });
  document.addEventListener('keydown', e => {
    const dialogAbierto = modal?.classList.contains('show');
    const menuAbierto = toggle?.getAttribute('aria-expanded') === 'true';
    if (e.key === 'Escape') {
      if (dialogAbierto) window.cerrarRegistro();
      if (menuAbierto) { menu(false); toggle.focus(); }
    }
    if (e.key !== 'Tab' || (!dialogAbierto && !menuAbierto)) return;
    const root = dialogAbierto ? modal : document.getElementById('sidebar');
    const items = [...root.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],select,textarea')].filter(el => el.getClientRects().length);
    if (!items.length) return;
    if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0].focus(); }
  });
  function passwords(root) {
    root.querySelectorAll('input[type=password]').forEach(input => {
      if (input.parentElement.classList.contains('password-field')) return;
      const field = document.createElement('div');
      field.className = 'password-field';
      input.before(field); field.append(input);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'password-toggle'; button.textContent = 'Mostrar';
      button.setAttribute('aria-label', 'Mostrar contraseña'); button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const visible = input.type === 'password';
        input.type = visible ? 'text' : 'password';
        button.textContent = visible ? 'Ocultar' : 'Mostrar';
        button.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
        button.setAttribute('aria-pressed', String(visible));
      }); field.append(button);
    });
  }
  function accesibilidad(root) {
    passwords(root);
    root.querySelectorAll('.form-message').forEach(el => { el.setAttribute('role','status'); el.setAttribute('aria-live','polite'); });
    root.querySelectorAll('.form-group').forEach(group => {
      const label = group.querySelector('label'); const input = group.querySelector('input,select,textarea');
      if (label && input && input.id && !label.htmlFor) label.htmlFor = input.id;
    });
    root.querySelectorAll('.table-wrapper').forEach(el => { el.tabIndex = 0; el.setAttribute('role','region'); el.setAttribute('aria-label','Tabla de resultados; desplázate para ver todas las columnas'); });
  }
  accesibilidad(document);
  const observer = new MutationObserver(() => accesibilidad(document));
  // Observar únicamente los cambios de contenido; no las modificaciones de atributos.
  const main = document.getElementById('mainContent');
  if (main) observer.observe(main, {childList:true,subtree:true});
  const loading = document.createElement('div'); loading.className = 'loading-indicator'; loading.hidden = true; loading.setAttribute('role','status'); loading.setAttribute('aria-label','Cargando sección'); document.body.append(loading);
  let navegando = false;
  const navegarOriginal = window.navegar;
  window.navegar = async seccion => {
    if (navegando) return;
    navegando = true; loading.hidden = false; main?.setAttribute('aria-busy','true');
    try {
      await navegarOriginal(seccion);
      if (seccion === 'inicio' && window.sesionActual?.rol === 'aspirante' && main?.querySelector('.welcome-card')) {
        const action = document.createElement('section'); action.className = 'next-step';
        const content = document.createElement('div');
        const title = document.createElement('h2'); title.textContent = 'Tu camino hacia una beca';
        const description = document.createElement('p'); description.textContent = 'Explora los programas disponibles o consulta el avance de tu solicitud.';
        const button = document.createElement('button'); button.type = 'button'; button.className = 'btn-primary'; button.innerHTML = 'Explorar becas ' + Iconos.svg('flecha'); button.onclick = () => window.navegar('fase1');
        content.append(title,description); action.append(content,button); main.querySelector('.welcome-card').after(action);
      }
      document.querySelectorAll('.sidebar-menu button').forEach(button => {
        const destino = button.dataset.archivos ? 'archivos' : button.getAttribute('onclick')?.match(/navegar\('([^']+)'\)/)?.[1];
        if (destino === seccion) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
      });
      menu(false); main?.focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
    } finally { navegando = false; loading.hidden = true; main?.removeAttribute('aria-busy'); }
  };
  window.mostrarAviso = texto => {
    document.querySelector('.toast')?.remove();
    const aviso = document.createElement('div'); aviso.className = 'toast'; aviso.setAttribute('role','alert');
    const message = document.createElement('span'); message.textContent = texto;
    const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label','Cerrar aviso'); close.onclick = () => aviso.remove();
    aviso.append(message,close); document.body.append(aviso);
  };
  for (const form of document.querySelectorAll('#loginForm,#registroForm')) {
    form.addEventListener('submit', () => {
      const button = form.querySelector('button[type=submit]');
      const texto = button.textContent;
      button.textContent = 'Procesando…'; form.setAttribute('aria-busy','true');
      const watch = new MutationObserver(() => {
        if (!button.disabled) { button.textContent = texto; form.removeAttribute('aria-busy'); watch.disconnect(); }
      }); watch.observe(button, {attributes:true,attributeFilter:['disabled']});
    });
  }
})();
