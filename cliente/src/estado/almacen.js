import { crearAlmacenEstado } from '../api/almacenEstado.js';

// Única instancia del estado del panel para toda la aplicación.
export const almacen = crearAlmacenEstado();
