// Adaptador de presentación: consume la API, sin credenciales ni consultas SQL.
export class SolicitudApi {
    async peticion(url, opciones) {
        let respuesta;
        try { respuesta = await fetch(url, opciones); }
        catch { throw new Error('No se pudo conectar con el backend. Abre la aplicación desde http://localhost:3000 después de iniciar el servidor.'); }
        const contenido = await respuesta.json();
        if (!respuesta.ok) throw new Error(contenido.error || 'No se pudo completar la operación.');
        return contenido;
    }
    registrar(datos) {
        const form = new FormData();
        for (const campo of ['nombre', 'correo', 'cui', 'beca']) form.append(campo, datos[campo]);
        form.append('archivo', datos.archivo);
        return this.peticion('/api/solicitudes', { method: 'POST', body: form });
    }
    consultarPorCui(cui) {
        return this.peticion(`/api/solicitudes?cui=${encodeURIComponent(cui)}`);
    }
    consultarPorExpediente(expediente) {
        if (!expediente.trim()) throw new Error('Ingresa un número de expediente.');
        return this.peticion(`/api/solicitudes/${encodeURIComponent(expediente)}`);
    }
}
