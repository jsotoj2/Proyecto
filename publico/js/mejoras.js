/* Interacciones de presentación; las operaciones siguen usando BecasData. */
(() => {
  const modal = document.getElementById('modalRegistro');
  let focusAnterior;
  window.abrirRegistro = () => {
    focusAnterior = document.activeElement;
    modal?.classList.add('show');
    document.body.classList.add('modal-open');
    document.getElementById('registroNombre')?.focus();
  };
  window.cerrarRegistro = () => {
    modal?.classList.remove('show');
    document.body.classList.remove('modal-open');
    focusAnterior?.focus();
  };
  modal?.addEventListener('click', e => { if (e.target === modal) window.cerrarRegistro(); });
  const toggle = document.getElementById('menuToggle');
  const backdrop = document.getElementById('menuBackdrop');
  function menu(abierto) {
    document.body.classList.toggle('menu-open', abierto);
    document.querySelector('.dashboard-main')?.toggleAttribute('inert', abierto);
    document.getElementById('sidebar')?.classList.toggle('is-open', abierto);
    toggle?.setAttribute('aria-expanded', String(abierto));
    toggle?.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (backdrop) backdrop.hidden = !abierto;
    if (abierto) document.querySelector('.sidebar-menu button')?.focus();
  }
  toggle?.addEventListener('click', () => menu(toggle.getAttribute('aria-expanded') !== 'true'));
  backdrop?.addEventListener('click', () => { menu(false); toggle?.focus(); });
  window.matchMedia('(max-width: 800px)').addEventListener('change', () => menu(false));
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
    root.querySelectorAll('.scholarship-item').forEach(button => {
      const id = button.getAttribute('onclick')?.match(/verBeca\((\d+)\)/)?.[1];
      button.setAttribute('aria-pressed', String(typeof AspiranteUI !== 'undefined' && Number(id) === AspiranteUI.becaSeleccionada));
    });
  }
  accesibilidad(document);
  const observer = new MutationObserver(() => accesibilidad(document));
  // Observar únicamente los cambios de contenido; no las modificaciones de atributos.
  const main = document.getElementById('mainContent');
  if (main) observer.observe(main, {childList:true,subtree:true});
  const loading = document.createElement('div'); loading.className = 'loading-indicator'; loading.hidden = true; loading.setAttribute('role','status'); loading.setAttribute('aria-label','Cargando sección'); document.body.append(loading);
  window.Interfaz = {
    mostrarCarga(activa) {
      loading.hidden = !activa;
      if (activa) main?.setAttribute('aria-busy', 'true');
      else main?.removeAttribute('aria-busy');
    },
    actualizarNavegacion(seccion) {
      document.querySelectorAll('.sidebar-menu button').forEach(button => {
        const destino = button.dataset.archivos ? 'archivos' : button.getAttribute('onclick')?.match(/navegar\('([^']+)'\)/)?.[1];
        const labels = {fase1: 'Solicitud', fase2: 'Revisión', fase3: 'Entrevista', fase4: 'Resultado'};
        if (labels[destino] && !button.querySelector('.nav-label')) {
          const icon = button.querySelector('svg');
          const label = document.createElement('span'); label.className = 'nav-label';
          const small = document.createElement('small'); small.textContent = 'Fase ' + destino.slice(-1);
          label.append(labels[destino], small); button.replaceChildren(...(icon ? [icon] : []), label);
        }
        if (button.dataset.archivos) {
          button.innerHTML = Iconos.svg('documento') + '<span>Documentos y registros</span>';
        }
        if (destino === seccion) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
      });
      const nav = document.querySelector('.sidebar-menu');
      if (nav && !nav.querySelector('.sidebar-caption')) {
        const caption = document.createElement('div'); caption.className = 'sidebar-caption'; caption.textContent = 'Mi espacio'; nav.prepend(caption);
        nav.setAttribute('aria-label', 'Navegación principal');
      }
      const activity = main?.querySelector('.activity-list');
      if (activity && !activity.children.length) {
        const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'Todavía no hay actividad registrada. Los movimientos de la plataforma aparecerán aquí.'; activity.append(empty);
      }
      menu(false); main?.focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'instant'});
    }
  };
  window.mostrarAviso = texto => {
    document.querySelector('.toast')?.remove();
    const aviso = document.createElement('div'); aviso.className = 'toast'; aviso.setAttribute('role','alert');
    const message = document.createElement('span'); message.textContent = texto;
    const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label','Cerrar aviso'); close.onclick = () => aviso.remove();
    aviso.append(message,close); document.body.append(aviso);
  };
})();
