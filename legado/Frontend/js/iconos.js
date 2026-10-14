/* Iconos vectoriales locales: no requieren fuentes ni servicios externos. */
window.Iconos = {
  svg(nombre) {
    const trazos = {
      inicio:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
      documento:'<path d="M14 2H5v20h14V7Z"/><path d="M14 2v5h5M8 12h8M8 16h8"/>',
      revision:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/>',
      calendario:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      estado:'<path d="M4 20h16M7 16v-5M12 16V4M17 16V8"/>',
      usuario:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
      usuarios:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 3a4 4 0 0 1 0 8M22 21v-2a7 7 0 0 0-4-6"/>',
      beca:'<path d="m2 9 10-5 10 5-10 5Zm4 2v6c4 3 8 3 12 0v-6M22 9v7"/>',
      buscar:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
      candado:'<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>',
      menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
      flecha:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
      salir:'<path d="M9 3H4v18h5M9 12h12m-5-5 5 5-5 5"/>',
      cerrar:'<path d="m6 6 12 12M18 6 6 18"/>'
    };
    return `<svg class="ui-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trazos[nombre] || trazos.documento}</svg>`;
  }
};
