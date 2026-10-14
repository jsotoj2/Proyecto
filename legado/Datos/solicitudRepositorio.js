// Capa de datos: conoce IndexedDB, pero no conoce la interfaz.
export class SolicitudRepositorio {
    constructor() {
        this.conexion = null;
    }

    abrir() {
        if (this.conexion) return this.conexion;
        this.conexion = new Promise((resolve, reject) => {
            if (!globalThis.indexedDB) {
                reject(new Error('Este navegador no permite guardar solicitudes.'));
                return;
            }
            const apertura = indexedDB.open('becas-solicitudes', 1);
            apertura.onupgradeneeded = () => {
                const tabla = apertura.result.createObjectStore('solicitudes', { keyPath: 'expediente' });
                tabla.createIndex('cui', 'cui');
                tabla.createIndex('cuiBeca', ['cui', 'beca'], { unique: true });
            };
            apertura.onsuccess = () => {
                const db = apertura.result;
                db.onversionchange = () => { db.close(); this.conexion = null; };
                resolve(db);
            };
            apertura.onerror = () => reject(apertura.error);
            apertura.onblocked = () => reject(new Error('Cierra las otras pestañas del proyecto y vuelve a intentarlo.'));
        }).catch(error => { this.conexion = null; throw error; });
        return this.conexion;
    }

    async ejecutar(modo, operacion) {
        const db = await this.abrir();
        return new Promise((resolve, reject) => {
            const transaccion = db.transaction('solicitudes', modo);
            const peticion = operacion(transaccion.objectStore('solicitudes'));
            let resultado;
            peticion.onsuccess = () => { resultado = peticion.result; };
            transaccion.oncomplete = () => resolve(resultado);
            transaccion.onabort = () => reject(peticion.error || transaccion.error || new Error('No se completó el almacenamiento.'));
            transaccion.onerror = () => {}; // El rechazo se maneja al abortar la transacción.
        });
    }

    guardar(solicitud) {
        return this.ejecutar('readwrite', tabla => tabla.add(solicitud));
    }

    buscarPorExpediente(expediente) {
        return this.ejecutar('readonly', tabla => tabla.get(expediente));
    }

    buscarPorCui(cui) {
        return this.ejecutar('readonly', tabla => tabla.index('cui').getAll(cui));
    }
}
