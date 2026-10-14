/* Cliente HTTP compartido. El servidor comprueba permisos y validaciones. */
(() => {
    let datosCache = null;
    let cargadoEn = 0;
    let cargaPendiente;
    const rutas = {
        'crear-beca': ['POST', 'becas'],
        formulario: ['POST', 'solicitudes'], descarga: ['POST', 'descargas'],
        fase2: ['POST', 'revisiones'], horario: ['POST', 'horarios'],
        reservar: ['POST', 'reservas'], entrevista: ['POST', 'entrevistas/completar'],
        fase4: ['POST', 'resultados'], cupos: ['PATCH', 'cupos'],
        'crear-usuario': ['POST', 'usuarios'], 'activar-usuario': ['PATCH', 'usuarios/estado']
    };
    const escapar = valor => String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[caracter]));
    function transformar(valor) {
        if (typeof valor === 'string') return escapar(valor);
        if (Array.isArray(valor)) return valor.map(transformar);
        if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([clave, contenido]) => [clave, transformar(contenido)]));
        return valor;
    }

    async function peticion(ruta, opciones = {}) {
        let respuesta;
        try { respuesta = await fetch('/api/plataforma/' + ruta, { credentials: 'same-origin', signal: AbortSignal.timeout(20000), ...opciones }); }
        catch (error) { throw new Error(error.name === 'TimeoutError' ? 'El servidor tardó demasiado en responder. Consulta el estado antes de volver a enviar.' : 'No se pudo conectar con el servidor. Revisa tu conexión.'); }
        let datos;
        try { datos = await respuesta.json(); } catch { throw new Error('El servidor devolvió una respuesta no válida.'); }
        if (!respuesta.ok) {
            if (respuesta.status === 401 && document.getElementById('dashboardPage')) location.href = 'index.html';
            throw Object.assign(new Error(datos.error || 'No se pudo completar la operación.'), { estado: respuesta.status });
        }
        return datos;
    }

    const api = (ruta, datos, metodo = 'POST') => peticion(ruta, datos === undefined ? {} : {
        method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
    });

    window.BecasData = {
        api, escapar,
        async cargar(forzar = false) {
            if (!forzar && datosCache && Date.now() - cargadoEn < 15000) return this.obtener();
            cargaPendiente ??= api('estado').then(datos => { datosCache = datos; cargadoEn = Date.now(); }).finally(() => { cargaPendiente = null; });
            await cargaPendiente;
            return this.obtener();
        },
        obtener() {
            if (!datosCache) throw new Error('Los datos todavía no se han cargado.');
            return transformar(structuredClone(datosCache));
        },
        async ejecutar(tipo, datos) {
            const ruta = rutas[tipo];
            if (!ruta) throw new Error('Operación no reconocida.');
            try {
                datosCache = await api(ruta[1], { ...datos, version: datosCache?.version }, ruta[0]);
                cargadoEn = Date.now();
            } catch (error) {
                if (error.estado === 409) await this.cargar(true).catch(() => {});
                throw error;
            }
        },
        version() { return datosCache?.version; },
        async subirPdf(id, archivo) {
            return peticion('pdf/' + id, { method: 'POST', headers: { 'Content-Type': 'application/pdf', 'X-File-Name': encodeURIComponent(archivo.name) }, body: archivo });
        }
    };
})();
