const ZONA = 'America/Guatemala';

// Las marcas de tiempo llegan en UTC; se muestran en la hora de Guatemala.
export function fechaHora(valor) {
    if (!valor) return '—';
    return new Date(valor).toLocaleString('es-GT', { timeZone: ZONA, dateStyle: 'medium', timeStyle: 'short' });
}

// Fechas de calendario (AAAA-MM-DD) sin hora: se interpretan como día local, no como medianoche UTC.
export function fechaCalendario(valor, estilo = 'medium') {
    if (!valor) return '—';
    const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number);
    if (!anio || !mes || !dia) return valor;
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-GT', { dateStyle: estilo });
}

export const capitalizar = (texto = '') => texto.charAt(0).toUpperCase() + texto.slice(1);

export function hora(valor) {
    if (!/^\d{2}:\d{2}/.test(valor ?? '')) return valor || '—';
    const [horas, minutos] = valor.split(':').map(Number);
    return new Date(2000, 0, 1, horas, minutos).toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' });
}

export function moneda(valor) {
    const numero = Number(valor);
    if (valor === '' || valor === null || valor === undefined || !Number.isFinite(numero)) return 'No indicado';
    return 'Q' + numero.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function nombreRol(rol) {
    return { aspirante: 'Aspirante', admin: 'Administrador', superadmin: 'Superadministrador' }[rol] ?? rol;
}

export function iniciales(nombre = '') {
    return nombre.trim().split(/\s+/).slice(0, 2).map(parte => parte.charAt(0).toUpperCase()).join('') || '?';
}

export function normalizar(texto = '') {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function nombreArchivo(texto) {
    return normalizar(texto).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
