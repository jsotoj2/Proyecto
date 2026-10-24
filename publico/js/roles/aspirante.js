const AspiranteUI = {

    becaSeleccionada:
        1,

    render(seccion) {

        this.renderMenu();

        switch (seccion) {

            case "fase1":
                this.renderFase1();
                break;

            case "fase2":
                this.renderFase2();
                break;

            case "fase3":
                this.renderFase3();
                break;

            case "fase4":
                this.renderFase4();
                break;

            case "estado":
                this.renderEstado();
                break;

            case "notificaciones":
                this.renderNotificaciones();
                break;

            default:
                this.renderInicio();

        }

    },

    renderMenu() {

        const sinLeer =
            (BecasData.obtener().notificaciones ?? [])
                .filter(item => !item.leida).length;

        document.getElementById(
            "sidebar"
        ).innerHTML = `

            <div class="sidebar-brand">

                <div class="brand-icon-small">
                    B
                </div>

                <div>

                    <strong>
                        Becas
                    </strong>

                    <span>
                        Nacionales
                    </span>

                </div>

            </div>

            <nav class="sidebar-menu">

                <button onclick="navegar('inicio')">
                    ${Iconos.svg("inicio")} Inicio
                </button>

                <button onclick="navegar('fase1')">
                    ${Iconos.svg("documento")} Fase 1
                </button>

                <button onclick="navegar('fase2')">
                    ${Iconos.svg("revision")} Fase 2
                </button>

                <button onclick="navegar('fase3')">
                    ${Iconos.svg("calendario")} Fase 3
                </button>

                <button onclick="navegar('fase4')">
                    ${Iconos.svg("check")} Fase 4
                </button>

                <button onclick="navegar('estado')">
                    ${Iconos.svg("estado")} Estado de beca
                </button>

                <button onclick="navegar('notificaciones')">
                    ${Iconos.svg("campana")} Notificaciones
                    ${sinLeer ? `<span class="badge-count" aria-label="${sinLeer} sin leer">${sinLeer}</span>` : ""}
                </button>

                <button onclick="navegar('cuenta')">
                    ${Iconos.svg("usuario")} Mi cuenta
                </button>

            </nav>

            <button
                class="logout-button"
                onclick="cerrarSesion()"
            >
                Cerrar sesión
            </button>
        `;

    },

    renderInicio() {
        document.getElementById('pageTitle').textContent = 'Mi panel';
        const solicitud = this.obtenerSolicitud();
        const enviada = Boolean(solicitud?.formularioEnviado);
        const revision = solicitud?.fase2?.estado;
        const entrevista = solicitud?.entrevista?.estado;
        const resultado = solicitud?.fase4?.estado;
        const finalizada = ['aceptada', 'rechazada'].includes(resultado);
        const etapas = [
            ['Solicitud', 'Explora los programas y completa tu formulario.', enviada ? 'Formulario enviado' : 'Comienza aquí', 'fase1'],
            ['Revisión', 'Consulta la revisión de tus documentos.', revision || 'Pendiente de solicitud', 'fase2'],
            ['Entrevista', 'Programa y consulta los detalles de tu entrevista.', entrevista || 'Pendiente de revisión', 'fase3'],
            ['Resultado', 'Consulta la decisión final de tu proceso.', resultado ? this.textoResultado(resultado) : 'Pendiente de evaluación', 'fase4']
        ];
        const destino = finalizada ? 'fase4' : !enviada ? 'fase1' : revision !== 'aceptada' ? 'fase2' : entrevista !== 'realizada' ? 'fase3' : 'fase4';
        const accion = {fase1: 'Explorar becas', fase2: 'Consultar revisión', fase3: 'Ver entrevista', fase4: 'Consultar resultado'}[destino];
        document.getElementById('mainContent').innerHTML = `
            <section class="welcome-card">
                <span class="eyebrow">TU ESPACIO DE OPORTUNIDADES</span>
                <h1>Hola, ${usuarioActual.nombre}</h1>
                <p>Cada paso te acerca a tu próximo objetivo. Aquí puedes gestionar tu solicitud y seguir su avance.</p>
            </section>
            <section class="next-step">
                <div><h2>${enviada ? 'Continúa tu proceso' : 'Tu próxima oportunidad empieza aquí'}</h2>
                <p>${enviada ? 'Consulta tu etapa actual y los detalles de tu solicitud.' : 'Conoce las becas disponibles y los requisitos para postularte.'}</p></div>
                <button type="button" class="btn-primary" onclick="navegar('${destino}')">${accion} ${Iconos.svg('flecha')}</button>
            </section>
            <div class="section-heading"><div><span class="eyebrow">PASO A PASO</span><h2>Tu proceso de solicitud</h2></div><span>4 etapas, un mismo objetivo</span></div>
            <div class="journey-grid">
                ${etapas.map(([titulo, descripcion, estado, seccion], i) => `<button type="button" class="journey-card" onclick="navegar('${seccion}')">
                    <span><span class="journey-number">0${i + 1}</span>${Iconos.svg('flecha')}</span>
                    <strong>${titulo}</strong><p>${descripcion}</p><span class="journey-status">${estado}</span>
                </button>`).join('')}
            </div>
            <div class="home-columns">
                <section class="panel"><span class="eyebrow">A TU ALCANCE</span><h2>Accesos rápidos</h2>
                    <button class="resource-link" onclick="navegar('estado')"><span><strong>Estado de mi beca</strong><small>Consulta el avance de todas las etapas.</small></span>${Iconos.svg('flecha')}</button>
                    <button class="resource-link" onclick="navegar('archivos')"><span><strong>Mis documentos</strong><small>Documentos y registros de procesos anteriores.</small></span>${Iconos.svg('flecha')}</button>
                    <button class="resource-link" onclick="navegar('cuenta')"><span><strong>Mi información personal</strong><small>Mantén tus datos de contacto actualizados.</small></span>${Iconos.svg('flecha')}</button>
                </section>
                <section class="panel"><span class="eyebrow">PREPARA TU SIGUIENTE PASO</span><h2>Antes de continuar</h2>
                    <ul class="checklist"><li>Revisa los requisitos del programa que te interesa.</li><li>Comprueba tus datos antes de enviar el formulario.</li><li>Consulta las observaciones de cada etapa.</li><li>Mantén actualizado tu correo de contacto.</li></ul>
                </section>
            </div>`;
    },

    renderFase1() {

        const datos =
            BecasData.obtener();

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 1";

        const becasHTML =
            datos.becas.map(
                beca => `

                    <button
                        class="scholarship-item"
                        onclick="AspiranteUI.verBeca(${beca.id})"
                    >
                        <strong>
                            ${beca.nombre}
                        </strong>

                        <span>
                            Ver información
                        </span>
                    </button>

                `
            ).join("");

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FASE 1
                    </span>

                    <h1>
                        Selecciona una beca
                    </h1>

                    <p>
                        Revisa las opciones disponibles y
                        completa tu formulario de solicitud.
                    </p>

                </div>

            </div>

            <div class="two-column-layout">

                <div class="panel">

                    <h3>
                        Becas disponibles
                    </h3>

                    <div class="scholarship-list">
                        ${becasHTML}
                    </div>

                </div>

                <div
                    id="detalleBeca"
                    class="panel"
                ></div>

            </div>
        `;

        this.verBeca(
            this.becaSeleccionada
        );

    },

    verBeca(id) {

        this.becaSeleccionada =
            id;

        const datos =
            BecasData.obtener();

        const beca =
            datos.becas.find(
                item =>
                    item.id === id
            );

        const requisitos =
            beca.requisitos.map(
                item =>
                    `<li>${item}</li>`
            ).join("");

        document.getElementById(
            "detalleBeca"
        ).innerHTML = `

            <span class="status-badge blue">
                Disponible
            </span>

            <h2>
                ${beca.nombre}
            </h2>

            <p>
                ${beca.descripcion}
            </p>

            <h4>
                Requisitos
            </h4>

            <ul class="requirements">
                ${requisitos}
            </ul>

            <button
                class="btn-secondary"
                onclick="AspiranteUI.descargarFormulario(${id})"
            >
                Descargar formulario de referencia
            </button>

            <hr class="separator">

            <h3>
                Formulario digital
            </h3>

            <p>
                Completa la información directamente
                desde la plataforma.
            </p>

            <div class="form-grid">

                <div class="form-group">

                    <label>
                        Edad
                    </label>

                    <input
                        id="formEdad"
                        type="number"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Teléfono
                    </label>

                    <input
                        id="formTelefono"
                    >

                </div>

                <div class="form-group full">

                    <label>
                        Dirección
                    </label>

                    <input
                        id="formDireccion"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Últimos estudios
                    </label>

                    <input
                        id="formEstudios"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Promedio
                    </label>

                    <input
                        id="formPromedio"
                        type="number"
                    >

                </div>

                <div class="form-group">

                    <label>
                        Monto solicitado (Q)
                    </label>

                    <input
                        id="formMonto"
                        type="number"
                        min="1"
                        step="0.01"
                        aria-describedby="formMontoAyuda"
                    >

                    <small id="formMontoAyuda">
                        Los montos mayores de Q10,000 requieren una segunda aprobación.
                    </small>

                </div>

                <div class="form-group full">

                    <label>
                        ¿Por qué deseas solicitar esta beca?
                    </label>

                    <textarea
                        id="formMotivo"
                        rows="5"
                    ></textarea>

                </div>

            </div>

            <button
                class="btn-primary"
                onclick="AspiranteUI.enviarFormulario()"
            >
                Enviar formulario
            </button>

            <div class="form-group">
                <label for="formPdf">Documentación PDF (opcional, máximo 5 MB)</label>
                <input id="formPdf" type="file" accept="application/pdf,.pdf">
            </div>
            <p
                id="fase1Mensaje"
                class="form-message"
            ></p>
        `;

    },

    async descargarFormulario(id) {
        return Operaciones.ejecutar(async () => {
        const beca = BecasData.obtener().becas.find(item => item.id === id);
        if (!beca) throw new Error('La beca ya no está disponible.');
        if (!window.jspdf?.jsPDF) throw new Error('No se pudo cargar la biblioteca PDF. Revisa tu conexión.');
        await BecasData.ejecutar('descarga', { becaId: id });
        const nombre = beca.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
        BecasPDF.crearFormulario(beca).save('solicitud-' + nombre + '.pdf');
        });
    },

    async enviarFormulario() {
        return Operaciones.ejecutar(async () => {
        const campos = { edad: 'formEdad', telefono: 'formTelefono', direccion: 'formDireccion', estudios: 'formEstudios', promedio: 'formPromedio', monto: 'formMonto', motivo: 'formMotivo' };
        const formulario = Object.fromEntries(Object.entries(campos).map(([campo, id]) => [campo, document.getElementById(id).value.trim()]));
        if (Object.values(formulario).some(valor => !valor)) throw new Error('Completa todos los campos del formulario.');
        const archivo = document.getElementById('formPdf')?.files[0];
        if (archivo && (archivo.size > 5 * 1024 * 1024 || !archivo.name.toLowerCase().endsWith('.pdf') || await archivo.slice(0, 5).text() !== '%PDF-')) {
            throw new Error('Adjunta un PDF válido de máximo 5 MB.');
        }
        await BecasData.ejecutar('formulario', { becaId: this.becaSeleccionada, formulario });
        if (archivo) {
            try { await BecasData.subirPdf(this.obtenerSolicitud().id, archivo); }
            catch (error) { throw new Error('La solicitud se guardó, pero no el PDF: ' + error.message); }
        }
        const mensaje = document.getElementById('fase1Mensaje');
        mensaje.textContent = 'Formulario enviado correctamente. Ahora será revisado por un administrador.';
        mensaje.className = 'form-message success';
        });
    },

    obtenerSolicitud() {

        const datos =
            BecasData.obtener();

        return datos.solicitudes.find(
            item =>
                item.usuario ===
                usuarioActual.usuario
        );

    },

    renderFase2() {

        const solicitud =
            this.obtenerSolicitud();

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 2";

        if (!solicitud) {

            this.bloqueada(
                "Fase 2",
                "Primero debes completar tu formulario de la Fase 1."
            );

            return;

        }

        const estado =
            solicitud.fase2.estado;

        let clase =
            "yellow";

        if (
            estado ===
            "aceptada"
        ) {
            clase =
                "green";
        }

        if (
            estado ===
            "rechazada"
        ) {
            clase =
                "red";
        }

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="panel">

                <span class="eyebrow">
                    FASE 2
                </span>

                <h1>
                    Revisión de formulario
                </h1>

                <span class="status-badge ${clase}">
                    ${estado.toUpperCase()}
                </span>

                <p class="large-text">

                    ${
                        estado === "pendiente"
                            ?
                            "Tu formulario está siendo analizado por nuestros administradores."
                            :
                        estado === "aceptada"
                            ?
                            "Tu formulario cumple con los requisitos y puedes continuar con el proceso."
                            :
                            "Tu formulario necesita una revisión o no cumple con los requisitos."
                    }

                </p>

                ${
                    solicitud.fase2.comentario
                    ?
                    `
                    <div class="comment-box">

                        <strong>
                            Comentario del administrador
                        </strong>

                        <p>
                            ${solicitud.fase2.comentario}
                        </p>

                    </div>
                    `
                    :
                    ""
                }

                <button
                    class="btn-secondary"
                    onclick="navegar('estado')"
                >
                    Ver estado de beca
                </button>

            </div>
        `;

    },

    renderFase3() {

        const datos =
            BecasData.obtener();

        const solicitud =
            this.obtenerSolicitud();

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 3";

        if (
            !solicitud ||
            solicitud.fase2.estado !==
                "aceptada"
        ) {

            this.bloqueada(
                "Fase 3",
                "Debes tener aprobada la Fase 2 antes de programar tu entrevista."
            );

            return;

        }

        if (
            solicitud.entrevista.fecha
        ) {

            document.getElementById(
                "mainContent"
            ).innerHTML = `

                <div class="panel">

                    <span class="eyebrow">
                        FASE 3
                    </span>

                    <h1>
                        Entrevista programada
                    </h1>

                    <div class="appointment-card">

                        <strong>
                            ${solicitud.entrevista.fecha}
                        </strong>

                        <span>
                            ${solicitud.entrevista.hora}
                        </span>

                        <span>
                            ${solicitud.entrevista.modalidad}
                        </span>

                        <span class="status-badge blue">
                            ${solicitud.entrevista.estado}
                        </span>

                    </div>

                </div>
            `;

            return;

        }

        const disponibles =
            datos.horarios.filter(
                item =>
                    !item.ocupado
            );

        const horariosHTML =
            disponibles.map(
                item => `

                    <label class="slot-card">

                        <input
                            type="radio"
                            name="horario"
                            value="${item.id}"
                        >

                        <strong>
                            ${item.fecha}
                        </strong>

                        <span>
                            ${item.hora}
                        </span>

                        <span>
                            ${item.modalidad}
                        </span>

                    </label>

                `
            ).join("");

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FASE 3
                    </span>

                    <h1>
                        Programar entrevista
                    </h1>

                    <p>
                        Selecciona una de las fechas
                        disponibles.
                    </p>

                </div>

            </div>

            <div class="slots-grid">

                ${
                    horariosHTML ||
                    "<p>No existen horarios disponibles.</p>"
                }

            </div>

            <button
                class="btn-primary"
                onclick="AspiranteUI.confirmarEntrevista()"
            >
                Confirmar cita
            </button>

        `;

    },

    async confirmarEntrevista() {
        return Operaciones.ejecutar(async () => {
        const seleccionado = document.querySelector('input[name="horario"]:checked');
        if (!seleccionado) throw new Error('Selecciona un horario.');
        await BecasData.ejecutar('reservar', { horarioId: Number(seleccionado.value) });
        this.renderFase3();
        });
    },

    renderFase4() {

        const solicitud =
            this.obtenerSolicitud();

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 4";

        if (
            !solicitud ||
            solicitud.entrevista.estado !==
                "realizada"
        ) {

            this.bloqueada(
                "Fase 4",
                "La decisión final estará disponible después de completar tu entrevista."
            );

            return;

        }

        const estado =
            solicitud.fase4.estado;

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="panel result-panel">

                <span class="eyebrow">
                    RESULTADO FINAL
                </span>

                ${
                    estado === "pendiente_aprobacion"
                    ?
                    `
                        <h1>
                            Solicitud en segunda aprobación
                        </h1>

                        <p>
                            Tu solicitud fue aprobada y, por
                            superar Q10,000, otro administrador
                            debe autorizarla. Te avisaremos en
                            tus notificaciones.
                        </p>
                    `
                    :
                    estado === "pendiente"
                    ?
                    `
                        <h1>
                            Solicitud en evaluación
                        </h1>

                        <p>
                            Nuestro equipo se encuentra
                            realizando la evaluación final
                            de tu solicitud.
                        </p>
                    `
                    :
                    estado === "aceptada"
                    ?
                    `
                        <div class="result-icon success-icon">
                            ${Iconos.svg("check")}
                        </div>

                        <h1>
                            ¡Felicidades!
                        </h1>

                        <p>
                            Tu perfil ha sido analizado
                            satisfactoriamente y has sido
                            seleccionado para formar parte
                            de nuestro programa de becas.
                        </p>

                        <p>
                            Bienvenido a Becas Nacionales.
                        </p>
                    `
                    :
                    `
                        <div class="result-icon error-icon">
                            ×
                        </div>

                        <h1>
                            Solicitud no aprobada
                        </h1>

                        <p>
                            Después de analizar tu perfil,
                            tu solicitud no fue seleccionada
                            en esta convocatoria.
                        </p>

                        <p>
                            No te desanimes. Puedes volver
                            a participar en futuras
                            convocatorias.
                        </p>
                    `
                }

                ${
                    solicitud.fase4.comentario &&
                    estado !== "pendiente_aprobacion"
                    ?
                    `
                        <div class="comment-box">

                            ${solicitud.fase4.comentario}

                        </div>
                    `
                    :
                    ""
                }

            </div>
        `;

    },

    renderEstado() {

        const solicitud =
            this.obtenerSolicitud();

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Estado de beca";

        if (!solicitud) {

            document.getElementById(
                "mainContent"
            ).innerHTML = `

                <div class="panel">

                    <h1>
                        Aún no tienes una solicitud
                    </h1>

                    <p>
                        Dirígete a la Fase 1 para
                        comenzar.
                    </p>

                </div>
            `;

            return;

        }

        const fase1 =
            solicitud.formularioEnviado;

        const fase2 =
            solicitud.fase2.estado;

        const fase3 =
            solicitud.entrevista.estado;

        const fase4 =
            solicitud.fase4.estado;

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        SEGUIMIENTO
                    </span>

                    <h1>
                        Estado de tu solicitud
                    </h1>

                    <p>
                        Consulta el avance de tu beca.
                    </p>

                </div>

            </div>

            <div class="timeline">

                ${this.paso(
                    "1",
                    "Formulario",
                    fase1
                        ? "Completada"
                        : "Pendiente",
                    fase1
                )}

                ${this.paso(
                    "2",
                    "Revisión",
                    fase2,
                    fase2 ===
                        "aceptada"
                )}

                ${this.paso(
                    "3",
                    "Entrevista",
                    fase3,
                    fase3 ===
                        "realizada"
                )}

                ${this.paso(
                    "4",
                    "Resultado",
                    this.textoResultado(fase4),
                    fase4 ===
                        "aceptada"
                )}

            </div>

        `;

    },

    textoResultado(estado) {

        return estado === "pendiente_aprobacion"
            ? "En segunda aprobación"
            : estado;

    },

    renderNotificaciones() {

        const notificaciones =
            BecasData.obtener().notificaciones ?? [];

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Notificaciones";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        AVISOS
                    </span>

                    <h1>
                        Notificaciones
                    </h1>

                    <p>
                        Cada cambio en tu solicitud aparece aquí.
                    </p>

                </div>

            </div>

            ${
                notificaciones.length
                ?
                `
                    <div class="notification-list">
                        ${notificaciones.map(item => `
                            <article class="notification-item ${item.leida ? "" : "unread"}">
                                <p>${item.mensaje}</p>
                                <time datetime="${item.fecha}">${fechaHora(item.fecha)}</time>
                            </article>
                        `).join("")}
                    </div>
                `
                :
                `
                    <section class="empty-state">
                        <h2>Sin notificaciones</h2>
                        <p>Te avisaremos cuando tu solicitud cambie de estado.</p>
                    </section>
                `
            }
        `;

        // Se marcan como leídas después de mostrarlas y se retira el contador del menú.
        if (notificaciones.some(item => !item.leida)) {
            BecasData.leerNotificaciones()
                .then(() => document.querySelector(".sidebar-menu .badge-count")?.remove())
                .catch(error => mostrarAviso(error.message));
        }

    },

    paso(numero, titulo, texto, completo) {

        return `

            <div class="timeline-step">

                <div
                    class="timeline-circle
                    ${completo ? "done" : ""}"
                >
                    ${numero}
                </div>

                <div>

                    <strong>
                        ${titulo}
                    </strong>

                    <span>
                        ${texto}
                    </span>

                </div>

            </div>
        `;

    },

    bloqueada(titulo, mensaje) {

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="locked-panel">

                <div class="lock-icon">
                    ${Iconos.svg("candado")}
                </div>

                <h1>
                    ${titulo} pendiente
                </h1>

                <p>
                    ${mensaje}
                </p>

                <button
                    class="btn-primary"
                    onclick="navegar('estado')"
                >
                    Ver estado de beca
                </button>

            </div>
        `;

    }

};

window.AspiranteUI =
    AspiranteUI;
