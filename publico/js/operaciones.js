/* Evita envíos simultáneos y presenta errores de las acciones del panel. */
window.Operaciones = {
    ocupada: false,
    async ejecutar(accion) {
        if (this.ocupada) return;
        this.ocupada = true;
        const boton = document.activeElement?.closest('button');
        if (boton) boton.disabled = true;
        try { return await accion(); }
        catch (error) { window.mostrarAviso(error.message); }
        finally { this.ocupada = false; if (boton) boton.disabled = false; }
    }
};
