// Capa de presentación: maneja eventos y muestra respuestas del servicio.
export function iniciarInterfaz(servicio) {
    const porId = id => document.getElementById(id);
    const filterButtons = document.querySelectorAll('.filter-btn');
    const becaCards = document.querySelectorAll('.beca-card');
    filterButtons.forEach(button => button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        becaCards.forEach(card => {
            card.style.display = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter ? 'flex' : 'none';
        });
    }));

    const modal = porId('applyModal');
    const form = porId('applyForm');
    const estadoRegistro = porId('registrationResult');
    let becaSeleccionada = '';
    document.querySelectorAll('.apply-btn').forEach(button => button.addEventListener('click', () => {
        becaSeleccionada = button.dataset.beca;
        porId('modalBecaTitle').textContent = `Postulación: ${becaSeleccionada}`;
        modal.classList.add('active');
        porId('studentName').focus();
    }));
    function cerrarModal() { modal.classList.remove('active'); }
    porId('closeModal').addEventListener('click', cerrarModal);
    window.addEventListener('click', event => { if (event.target === modal) cerrarModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') cerrarModal(); });

    function mensaje(contenedor, contenido) {
        contenedor.replaceChildren();
        const parrafo = document.createElement('p');
        parrafo.textContent = contenido;
        contenedor.append(parrafo);
        contenedor.classList.remove('hidden');
    }

    function mostrarSolicitudes(contenedor, solicitudes) {
        contenedor.replaceChildren();
        if (!solicitudes.length) {
            mensaje(contenedor, 'No se encontraron solicitudes guardadas para esta consulta.');
            return;
        }
        for (const solicitud of solicitudes) {
            const detalle = document.createElement('section');
            const titulo = document.createElement('h4');
            titulo.textContent = solicitud.expediente;
            detalle.append(titulo);
            const campos = [
                ['Postulante', solicitud.nombre], ['CUI', solicitud.cui],
                ['Beca', solicitud.beca], ['Estado', solicitud.estado],
                ['PDF', solicitud.archivoNombre]
            ];
            for (const [etiqueta, valor] of campos) {
                const linea = document.createElement('p');
                const rotulo = document.createElement('strong');
                rotulo.textContent = `${etiqueta}: `;
                linea.append(rotulo, document.createTextNode(valor));
                detalle.append(linea);
            }
            contenedor.append(detalle);
        }
        contenedor.classList.remove('hidden');
    }

    async function conEspera(button, accion, alError) {
        button.disabled = true;
        try { await accion(); }
        catch (error) { alError(error.message || 'No se pudo completar la operación.'); }
        finally { button.disabled = false; }
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        await conEspera(form.querySelector('[type="submit"]'), async () => {
            const solicitud = await servicio.registrar({
                nombre: porId('studentName').value,
                correo: porId('studentEmail').value,
                cui: porId('studentCui').value,
                archivo: porId('studentFile').files[0],
                beca: becaSeleccionada
            });
            mensaje(estadoRegistro, `Solicitud guardada. Tu expediente es ${solicitud.expediente}. Estado: ${solicitud.estado}. Conserva este número.`);
            estadoRegistro.focus();
            form.reset();
            cerrarModal();
        }, contenido => window.alert(contenido));
    });

    porId('quickCheckForm').addEventListener('submit', async event => {
        event.preventDefault();
        const resultado = porId('quickResult');
        await conEspera(event.currentTarget.querySelector('[type="submit"]'), async () => {
            mostrarSolicitudes(resultado, await servicio.consultarPorCui(porId('cuiInput').value));
        }, contenido => mensaje(resultado, contenido));
    });
    async function consultarExpediente() {
        const resultado = porId('fullResultCard');
        await conEspera(porId('btnSearchExp'), async () => {
            const solicitud = await servicio.consultarPorExpediente(porId('searchExpediente').value);
            mostrarSolicitudes(resultado, solicitud ? [solicitud] : []);
        }, contenido => mensaje(resultado, contenido));
    }
    porId('btnSearchExp').addEventListener('click', consultarExpediente);
    porId('searchExpediente').addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); consultarExpediente(); }
    });
    document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', event => {
        const id = anchor.getAttribute('href');
        if (id === '#') { event.preventDefault(); return; }
        const destino = document.getElementById(id.slice(1));
        if (destino) { event.preventDefault(); destino.scrollIntoView({ behavior: 'smooth' }); }
    }));
}
