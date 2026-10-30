import { Award, Bell, CalendarClock, ChartColumn, ClipboardCheck, FileText, FolderOpen, GraduationCap, History, House, Inbox, ShieldCheck, Users } from 'lucide-react';

/*
 * Menú del panel por rol. `contador` indica qué número mostrar junto a la opción
 * (se calcula en la barra lateral con el estado actual).
 */
// El perfil y el cierre de sesión están en el menú de la cuenta (barra superior).
const comunes = [
    { ruta: '/panel/documentos', etiqueta: 'Documentos y registros', icono: FolderOpen }
];

// Secciones que no aparecen en la barra lateral pero sí en la ruta de navegación.
const OCULTAS = [{ ruta: '/panel/cuenta', etiqueta: 'Mi perfil' }];

const administracion = [
    { ruta: '/panel', etiqueta: 'Inicio', icono: House, exacta: true },
    { ruta: '/panel/solicitudes', etiqueta: 'Solicitudes', icono: Inbox, contador: 'porRevisar' },
    { ruta: '/panel/formularios', etiqueta: 'Formularios por beca', icono: FileText },
    { ruta: '/panel/entrevistas', etiqueta: 'Entrevistas', icono: CalendarClock },
    { ruta: '/panel/aprobaciones', etiqueta: 'Segunda aprobación', icono: ShieldCheck, contador: 'segundaAprobacion' },
    { ruta: '/panel/bitacora', etiqueta: 'Bitácora', icono: History }
];

export const NAVEGACION = {
    aspirante: [
        {
            elementos: [
                { ruta: '/panel', etiqueta: 'Inicio', icono: House, exacta: true },
                { ruta: '/panel/becas', etiqueta: 'Becas disponibles', icono: GraduationCap },
                { ruta: '/panel/solicitud', etiqueta: 'Mi solicitud', icono: ClipboardCheck },
                { ruta: '/panel/notificaciones', etiqueta: 'Notificaciones', icono: Bell, contador: 'notificaciones' }
            ]
        },
        { titulo: 'Mi espacio', elementos: comunes }
    ],
    admin: [
        { elementos: administracion },
        { titulo: 'Mi espacio', elementos: comunes }
    ],
    superadmin: [
        { elementos: administracion },
        {
            titulo: 'Superadministración',
            elementos: [
                { ruta: '/panel/usuarios', etiqueta: 'Usuarios', icono: Users },
                { ruta: '/panel/programas', etiqueta: 'Becas y cupos', icono: Award },
                { ruta: '/panel/estadisticas', etiqueta: 'Estadísticas', icono: ChartColumn }
            ]
        },
        { titulo: 'Mi espacio', elementos: comunes }
    ]
};

export function contadores(datos, usuario) {
    if (!datos) return {};
    return {
        notificaciones: (datos.notificaciones ?? []).filter(item => !item.leida).length,
        porRevisar: datos.solicitudes.filter(item => item.formularioEnviado && item.fase2.estado === 'pendiente').length,
        segundaAprobacion: datos.solicitudes.filter(item => item.fase4.estado === 'pendiente_aprobacion' && item.fase4.aprobadoPor !== usuario?.usuario).length
    };
}

/** Sección del menú que corresponde a una ruta (la coincidencia más específica). */
export function seccionActual(rol, ruta) {
    const elementos = [...(NAVEGACION[rol] ?? []).flatMap(seccion => seccion.elementos), ...OCULTAS];
    return elementos
        .filter(item => ruta === item.ruta || ruta.startsWith(item.ruta + '/'))
        .sort((a, b) => b.ruta.length - a.ruta.length)[0] ?? null;
}
