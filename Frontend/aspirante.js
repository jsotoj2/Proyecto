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

            default:
                this.renderInicio();

        }

    },


    renderMenu() {

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
                    🏠 Inicio
                </button>

                <button onclick="navegar('fase1')">
                    ① Fase 1
                </button>

                <button onclick="navegar('fase2')">
                    ② Fase 2
                </button>

                <button onclick="navegar('fase3')">
                    ③ Fase 3
                </button>

                <button onclick="navegar('fase4')">
                    ④ Fase 4
                </button>

                <button onclick="navegar('estado')">
                    📊 Estado de beca
                </button>

                <button onclick="navegar('cuenta')">
                    👤 Mi cuenta
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

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Inicio";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="welcome-card">

                <span class="eyebrow">
                    ASPIRANTE
                </span>

                <h1>
                    Bienvenido,
                    ${usuarioActual.nombre}
                </h1>

                <p>
                    Desde aquí podrás realizar y consultar
                    todo el proceso de solicitud de tu beca.
                </p>

            </div>

            <div class="info-grid">

                <article class="panel">

                    <h3>
                        ¿Quiénes somos?
                    </h3>

                    <p>
                        Somos una plataforma orientada a
                        facilitar la gestión y seguimiento
                        de programas de becas académicas.
                    </p>

                </article>

                <article class="panel">

                    <h3>
                        Misión
                    </h3>

                    <p>
                        Facilitar el acceso a oportunidades
                        educativas mediante procesos claros,
                        organizados y transparentes.
                    </p>

                </article>

                <article class="panel">

                    <h3>
                        Visión
                    </h3>

                    <p>
                        Ser una plataforma confiable para la
                        administración integral de programas
                        de becas a nivel nacional.
                    </p>

                </article>

            </div>
        `;

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

            <p
                id="fase1Mensaje"
                class="form-message"
            ></p>
        `;

    },


    descargarFormulario(id) {

        const datos =
            BecasData.obtener();

        const existe =
            datos.descargas.find(
                item =>
                    item.usuario ===
                        usuarioActual.usuario &&
                    item.becaId === id
            );

        if (!existe) {

            datos.descargas.push({

                usuario:
                    usuarioActual.usuario,

                becaId:
                    id,

                fecha:
                    new Date()
                        .toISOString()
                        .split("T")[0]

            });

            BecasData.guardar(datos);

        }

        alert(
            "Descarga registrada correctamente. En la versión final aquí se descargará el formulario PDF."
        );

    },


    enviarFormulario() {

        const datos =
            BecasData.obtener();

        const edad =
            document.getElementById(
                "formEdad"
            ).value;

        const telefono =
            document.getElementById(
                "formTelefono"
            ).value;

        const direccion =
            document.getElementById(
                "formDireccion"
            ).value;

        const estudios =
            document.getElementById(
                "formEstudios"
            ).value;

        const promedio =
            document.getElementById(
                "formPromedio"
            ).value;

        const motivo =
            document.getElementById(
                "formMotivo"
            ).value;

        if (
            !edad ||
            !telefono ||
            !direccion ||
            !estudios ||
            !promedio ||
            !motivo
        ) {

            document.getElementById(
                "fase1Mensaje"
            ).textContent =
                "Debes completar todos los campos.";

            return;
        }

        let solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuarioActual.usuario
            );

        if (!solicitud) {

            solicitud = {

                id:
                    Date.now(),

                usuario:
                    usuarioActual.usuario,

                dpi:
                    usuarioActual.dpi,

                becaId:
                    this.becaSeleccionada,

                fechaFormulario:
                    new Date()
                        .toISOString()
                        .split("T")[0],

                formularioEnviado:
                    true,

                formulario: {},

                fase2: {
                    estado:
                        "pendiente",
                    comentario:
                        ""
                },

                entrevista: {
                    fecha:
                        "",
                    hora:
                        "",
                    modalidad:
                        "",
                    estado:
                        "pendiente"
                },

                fase4: {
                    estado:
                        "pendiente",
                    comentario:
                        ""
                }

            };

            datos.solicitudes.push(
                solicitud
            );

        }

        solicitud.becaId =
            this.becaSeleccionada;

        solicitud.formularioEnviado =
            true;

        solicitud.formulario = {

            nombre:
                usuarioActual.nombre,

            edad,
            telefono,
            direccion,
            estudios,
            promedio,
            motivo

        };

        datos.actividad.unshift({

            texto:
                `${usuarioActual.nombre} envió su formulario.`,

            fecha:
                new Date()
                    .toLocaleDateString(
                        "es-GT"
                    )

        });

        BecasData.guardar(datos);

        document.getElementById(
            "fase1Mensaje"
        ).textContent =
            "Formulario enviado correctamente. Ahora será revisado por un administrador.";

        document.getElementById(
            "fase1Mensaje"
        ).className =
            "form-message success";

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


    confirmarEntrevista() {

        const seleccionado =
            document.querySelector(
                'input[name="horario"]:checked'
            );

        if (!seleccionado) {

            alert(
                "Selecciona un horario."
            );

            return;

        }

        const datos =
            BecasData.obtener();

        const horario =
            datos.horarios.find(
                item =>
                    item.id ===
                    Number(
                        seleccionado.value
                    )
            );

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuarioActual.usuario
            );

        horario.ocupado =
            true;

        horario.usuario =
            usuarioActual.usuario;

        solicitud.entrevista = {

            fecha:
                horario.fecha,

            hora:
                horario.hora,

            modalidad:
                horario.modalidad,

            estado:
                "programada"

        };

        BecasData.guardar(datos);

        this.renderFase3();

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
                            ✓
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
                    solicitud.fase4.comentario
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
                    fase4,
                    fase4 ===
                        "aceptada"
                )}

            </div>

        `;

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
                    🔒
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