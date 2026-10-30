import { useSyncExternalStore } from 'react';
import { almacen } from './almacen.js';

/** Estado del panel (becas, solicitudes, horarios, usuarios…) y operaciones sobre él. */
export function useDatos() {
    const datos = useSyncExternalStore(almacen.suscribir, almacen.obtener);
    return {
        datos,
        cargar: almacen.cargar,
        ejecutar: almacen.ejecutar,
        leerNotificaciones: almacen.leerNotificaciones
    };
}
