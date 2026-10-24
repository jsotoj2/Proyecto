const AdminUI = {

    render(
        seccion,
        esSuper = false
    ) {

        this.esSuper =
            esSuper;

        this.renderMenu(
            esSuper
        );

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

            case "auditoria":

                this.renderAuditoria();
                break;

            default:

                this.renderInicio();

        }

    },

    renderMenu(esSuper) {

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
                    ${Iconos.svg("buscar")} Estado de beca
                </button>

                <button onclick="navegar('auditoria')">
                    ${Iconos.svg("auditoria")} Bitácora
                </button>

                ${
                    esSuper
                    ?
                    `
                        <div class="menu-divider">
                            SUPER ADMIN
                        </div>

                        <button onclick="navegar('usuarios')">
                            ${Iconos.svg("usuarios")} Usuarios
                        </button>

                        <button onclick="navegar('cupos')">
                            ${Iconos.svg("beca")} Becas y cupos
                        </button>

                        <button onclick="navegar('estadisticas')">
                            ${Iconos.svg("estado")} Estadísticas
                        </button>
                    `
                    :
                    ""
                }

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

        const datos =
            BecasData.obtener();

        const aspirantes =
            datos.usuarios.filter(
                item =>
                    item.rol ===
                    "aspirante"
            ).length;

        const enviados =
            datos.solicitudes.filter(
                item =>
                    item.formularioEnviado
            ).length;

        const descargados =
            datos.descargas.length;

        const aceptados =
            datos.solicitudes.filter(
                item =>
                    item.fase4.estado ===
                    "aceptada"
            ).length;

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Panel administrativo";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="welcome-card">

                <span class="eyebrow">
                    ADMINISTRACIÓN
                </span>

                <h1>
                    Bienvenido,
                    ${usuarioActual.nombre}
                </h1>

                <p>
                    Consulta rápidamente la actividad
                    de la plataforma.
                </p>

            </div>

            <div class="stats-grid">

                ${this.stat(
                    "Aspirantes",
                    aspirantes,
                    Iconos.svg("usuarios")
                )}

                ${this.stat(
                    "Formularios descargados",
                    descargados,
                    "⬇"
                )}

                ${this.stat(
                    "Formularios enviados",
                    enviados,
                    Iconos.svg("documento")
                )}

                ${this.stat(
                    "Becas otorgadas",
                    aceptados,
                    Iconos.svg("beca")
                )}

            </div>

            <div class="panel">

                <div class="section-title">

                    <div>

                        <span class="eyebrow">
                            MOVIMIENTOS
                        </span>

                        <h2>
                            Actividad reciente
                        </h2>

                    </div>

                </div>

                <div class="activity-list">

                    ${
                        datos.actividad
                            .slice(0, 6)
                            .map(
                                item => `

                                    <div class="activity-item">

                                        <div class="activity-dot"></div>

                                        <div>

                                            <strong>
                                                ${item.texto}
                                            </strong>

                                            <span>
                                                ${item.fecha}
                                            </span>

                                        </div>

                                    </div>

                                `
                            )
                            .join("")
                    }

                </div>

            </div>
        `;

    },

    stat(
        titulo,
        numero,
        icono
    ) {

        return `

            <div class="stat-card">

                <div class="stat-icon">
                    ${icono}
                </div>

                <span>
                    ${titulo}
                </span>

                <strong>
                    ${numero}
                </strong>

            </div>
        `;

    },

    renderFase1() {

        const datos =
            BecasData.obtener();

        const becas =
            datos.becas.map(
                beca => {

                    const descargas =
                        datos.descargas.filter(
                            item =>
                                item.becaId ===
                                beca.id
                        ).length;

                    const enviados =
                        datos.solicitudes.filter(
                            item =>
                                item.becaId ===
                                    beca.id &&
                                item.formularioEnviado
                        ).length;

                    return `

                        <div class="admin-scholarship-card">

                            <div>

                                <span class="eyebrow">
                                    BECA
                                </span>

                                <h3>
                                    ${beca.nombre}
                                </h3>

                            </div>

                            <div class="mini-stats">

                                <span>
                                    Descargas
                                    <strong>
                                        ${descargas}
                                    </strong>
                                </span>

                                <span>
                                    Enviados
                                    <strong>
                                        ${enviados}
                                    </strong>
                                </span>

                            </div>

                            <button
                                class="btn-primary"
                                onclick="AdminUI.verFormularios(${beca.id})"
                            >
                                Ver formularios
                            </button>

                        </div>
                    `;

                }
            ).join("");

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 1";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FASE 1
                    </span>

                    <h1>
                        Solicitudes por beca
                    </h1>

                    <p>
                        Consulta formularios descargados
                        y enviados.
                    </p>

                </div>

            </div>

            <div class="scholarships-admin-grid">

                ${becas}

            </div>
        `;

    },

    verFormularios(becaId) {

        const datos =
            BecasData.obtener();

        const beca =
            datos.becas.find(
                item =>
                    item.id ===
                    becaId
            );

        const solicitudes =
            datos.solicitudes.filter(
                item =>
                    item.becaId ===
                    becaId &&
                    item.formularioEnviado
            );

        let filas =
            "";

        solicitudes.forEach(
            solicitud => {

                const usuario =
                    datos.usuarios.find(
                        item =>
                            item.usuario ===
                            solicitud.usuario
                    );

                filas += `

                    <tr>

                        <td>
                            ${usuario.nombre}
                        </td>

                        <td>
                            ${usuario.dpi}
                        </td>

                        <td>
                            ${solicitud.fechaFormulario}
                        </td>

                        <td>

                            <span class="status-badge green">
                                Enviado
                            </span>

                        </td>

                        <td>

                            <button
                                class="table-button"
                                onclick="AdminUI.generarPDF('${solicitud.usuario}')"
                            >
                                Descargar PDF
                            </button>

                        </td>

                    </tr>
                `;

            }
        );

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <button
                class="back-button"
                onclick="navegar('fase1')"
            >
                ← Regresar
            </button>

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FORMULARIOS
                    </span>

                    <h1>
                        ${beca.nombre}
                    </h1>

                </div>

            </div>

            <div class="panel table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Aspirante
                            </th>

                            <th>
                                DPI
                            </th>

                            <th>
                                Fecha
                            </th>

                            <th>
                                Estado
                            </th>

                            <th>
                                Formulario
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            filas ||
                            `
                                <tr>
                                    <td colspan="5">
                                        No existen formularios enviados.
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>
        `;

    },

    generarPDF(usuarioNombre) {

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuarioNombre
            );

        const usuario =
            datos.usuarios.find(
                item =>
                    item.usuario ===
                    usuarioNombre
            );

        const beca =
            datos.becas.find(
                item =>
                    item.id ===
                    solicitud.becaId
            );

        const {
            jsPDF
        } =
            window.jspdf;

        const pdf =
            new jsPDF();

        pdf.setFontSize(18);

        pdf.text(
            "Solicitud de Beca",
            20,
            20
        );

        pdf.setFontSize(11);

        const lineas = [

            `Nombre: ${usuario.nombre}`,

            `DPI: ${usuario.dpi}`,

            `Correo: ${usuario.correo}`,

            `Beca: ${beca.nombre}`,

            `Edad: ${solicitud.formulario.edad}`,

            `Telefono: ${solicitud.formulario.telefono}`,

            `Direccion: ${solicitud.formulario.direccion}`,

            `Estudios: ${solicitud.formulario.estudios}`,

            `Promedio: ${solicitud.formulario.promedio}`,

            "",

            "Motivo de solicitud:",

            solicitud.formulario.motivo

        ];

        let y =
            35;

        lineas.forEach(
            linea => {

                const texto =
                    pdf.splitTextToSize(
                        linea,
                        165
                    );

                pdf.text(
                    texto,
                    20,
                    y
                );

                y +=
                    texto.length * 7;

            }
        );

        pdf.save(
            `Solicitud_${usuario.usuario}.pdf`
        );

    },

    renderFase2() {

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 2";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FASE 2
                    </span>

                    <h1>
                        Evaluación de solicitud
                    </h1>

                    <p>
                        Busca al aspirante mediante su DPI.
                    </p>

                </div>

            </div>

            <div class="search-panel">

                <input
                    id="buscarDpiFase2"
                    placeholder="Ingresa los 13 dígitos del DPI"
                >

                <button
                    class="btn-primary"
                    onclick="AdminUI.buscarFase2()"
                >
                    Buscar aspirante
                </button>

            </div>

            <div id="resultadoFase2"></div>
        `;

    },

    buscarFase2() {

        const dpi =
            document.getElementById(
                "buscarDpiFase2"
            ).value.trim();

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.dpi === dpi
            );

        const resultado =
            document.getElementById(
                "resultadoFase2"
            );

        if (!solicitud) {

            resultado.innerHTML = `

                <div class="alert error-alert">
                    No se encontró una solicitud con ese DPI.
                </div>
            `;

            return;

        }

        const usuario =
            datos.usuarios.find(
                item =>
                    item.usuario ===
                    solicitud.usuario
            );

        const beca =
            datos.becas.find(
                item =>
                    item.id ===
                    solicitud.becaId
            );

        resultado.innerHTML = `

            <div class="panel applicant-result">

                <span class="eyebrow">
                    ASPIRANTE ENCONTRADO
                </span>

                <h2>
                    ${usuario.nombre}
                </h2>

                <div class="details-grid">

                    <div>
                        <span>DPI</span>
                        <strong>
                            ${usuario.dpi}
                        </strong>
                    </div>

                    <div>
                        <span>Correo</span>
                        <strong>
                            ${usuario.correo}
                        </strong>
                    </div>

                    <div>
                        <span>Beca</span>
                        <strong>
                            ${beca.nombre}
                        </strong>
                    </div>

                    <div>
                        <span>Promedio</span>
                        <strong>
                            ${solicitud.formulario.promedio}
                        </strong>
                    </div>

                </div>

                <div class="decision-buttons">

                    <button
                        class="btn-success"
                        onclick="AdminUI.aceptarFase2('${solicitud.usuario}')"
                    >
                        ${Iconos.svg("check")} Aceptar formulario
                    </button>

                    <button
                        class="btn-danger"
                        onclick="AdminUI.mostrarRechazoFase2()"
                    >
                        × Rechazar formulario
                    </button>

                </div>

                <div
                    id="rechazoFase2"
                    class="rejection-box hidden"
                >

                    <label>
                        Motivo o comentario
                    </label>

                    <textarea
                        id="comentarioFase2"
                        rows="4"
                        placeholder="Describe el motivo del rechazo o información pendiente..."
                    ></textarea>

                    <button
                        class="btn-danger"
                        onclick="AdminUI.rechazarFase2('${solicitud.usuario}')"
                    >
                        Confirmar rechazo
                    </button>

                </div>

            </div>
        `;

    },

    mostrarRechazoFase2() {

        document.getElementById(
            "rechazoFase2"
        ).classList.remove(
            "hidden"
        );

    },

    async aceptarFase2(usuario) {
        return Operaciones.ejecutar(async () => {

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuario
            );

        solicitud.fase2.estado =
            "aceptada";

        solicitud.fase2.comentario =
            "Tu formulario cumple con los requisitos establecidos.";

        await BecasData.ejecutar('fase2', { usuario, estado: 'aceptada', comentario: 'Tu formulario cumple con los requisitos establecidos.' });

        alert(
            "Formulario aceptado correctamente."
        );

        this.renderFase2();

        });
    },

    async rechazarFase2(usuario) {
        return Operaciones.ejecutar(async () => {

        const comentario =
            document.getElementById(
                "comentarioFase2"
            ).value.trim();

        if (!comentario) {

            alert(
                "Debes agregar un comentario."
            );

            return;

        }

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuario
            );

        solicitud.fase2.estado =
            "rechazada";

        solicitud.fase2.comentario =
            comentario;

        await BecasData.ejecutar('fase2', { usuario, estado: 'rechazada', comentario });

        alert(
            "Resultado actualizado."
        );

        this.renderFase2();

        });
    },

    renderFase3() {

        const datos =
            BecasData.obtener();

        const horarios =
            datos.horarios.map(
                horario => `

                    <tr>

                        <td>
                            ${horario.fecha}
                        </td>

                        <td>
                            ${horario.hora}
                        </td>

                        <td>
                            ${horario.modalidad}
                        </td>

                        <td>

                            ${
                                horario.ocupado
                                ?
                                `<span class="status-badge red">Ocupado</span>`
                                :
                                `<span class="status-badge green">Disponible</span>`
                            }

                        </td>

                    </tr>

                `
            ).join("");

        const citas =
            datos.solicitudes.filter(
                item =>
                    item.entrevista.fecha
            );

        const citasHTML =
            citas.map(
                solicitud => {

                    const usuario =
                        datos.usuarios.find(
                            item =>
                                item.usuario ===
                                solicitud.usuario
                        );

                    return `

                        <tr>

                            <td>
                                ${usuario.nombre}
                            </td>

                            <td>
                                ${solicitud.entrevista.fecha}
                            </td>

                            <td>
                                ${solicitud.entrevista.hora}
                            </td>

                            <td>
                                ${solicitud.entrevista.modalidad}
                            </td>

                            <td>

                                ${
                                    solicitud.entrevista.estado ===
                                    "realizada"
                                    ?
                                    `<span class="status-badge green">Realizada</span>`
                                    :
                                    `
                                    <button
                                        class="table-button"
                                        onclick="AdminUI.marcarEntrevista('${solicitud.usuario}')"
                                    >
                                        Marcar realizada
                                    </button>
                                    `
                                }

                            </td>

                        </tr>
                    `;

                }
            ).join("");

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 3";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FASE 3
                    </span>

                    <h1>
                        Gestión de entrevistas
                    </h1>

                    <p>
                        Define los espacios disponibles
                        para los aspirantes.
                    </p>

                </div>

            </div>

            <div class="panel">

                <h3>
                    Agregar disponibilidad
                </h3>

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Fecha
                        </label>

                        <input
                            id="nuevaFecha"
                            type="date"
                        >

                    </div>

                    <div class="form-group">

                        <label>
                            Hora
                        </label>

                        <input
                            id="nuevaHora"
                            type="time"
                        >

                    </div>

                    <div class="form-group full">

                        <label>
                            Modalidad
                        </label>

                        <select id="nuevaModalidad">

                            <option>
                                Presencial
                            </option>

                            <option>
                                Virtual
                            </option>

                        </select>

                    </div>

                </div>

                <button
                    class="btn-primary"
                    onclick="AdminUI.agregarHorario()"
                >
                    Agregar horario
                </button>

            </div>

            <div class="panel table-wrapper">

                <h3>
                    Horarios disponibles
                </h3>

                <table>

                    <thead>

                        <tr>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Modalidad</th>
                            <th>Estado</th>
                        </tr>

                    </thead>

                    <tbody>
                        ${horarios}
                    </tbody>

                </table>

            </div>

            <div class="panel table-wrapper">

                <h3>
                    Entrevistas programadas
                </h3>

                <table>

                    <thead>

                        <tr>
                            <th>Aspirante</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Modalidad</th>
                            <th>Acción</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${
                            citasHTML ||
                            `
                                <tr>
                                    <td colspan="5">
                                        No existen entrevistas programadas.
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>
        `;

    },

    async agregarHorario() {
        return Operaciones.ejecutar(async () => {

        const fecha =
            document.getElementById(
                "nuevaFecha"
            ).value;

        const hora =
            document.getElementById(
                "nuevaHora"
            ).value;

        const modalidad =
            document.getElementById(
                "nuevaModalidad"
            ).value;

        if (
            !fecha ||
            !hora
        ) {

            alert(
                "Selecciona fecha y hora."
            );

            return;

        }

        const datos =
            BecasData.obtener();

        datos.horarios.push({

            id:
                Date.now(),

            fecha,
            hora,
            modalidad,

            ocupado:
                false,

            usuario:
                ""

        });

        await BecasData.ejecutar('horario', { fecha, hora, modalidad });

        this.renderFase3();

        });
    },

    async marcarEntrevista(usuario) {
        return Operaciones.ejecutar(async () => {

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuario
            );

        solicitud.entrevista.estado =
            "realizada";

        await BecasData.ejecutar('entrevista', { usuario });

        this.renderFase3();

        });
    },

    renderFase4() {

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Fase 4";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        FASE 4
                    </span>

                    <h1>
                        Decisión final
                    </h1>

                    <p>
                        Busca un aspirante mediante DPI
                        para revisar su expediente completo.
                    </p>

                </div>

            </div>

            <div class="search-panel">

                <input
                    id="buscarDpiFase4"
                    placeholder="Ingresa DPI"
                >

                <button
                    class="btn-primary"
                    onclick="AdminUI.buscarFase4()"
                >
                    Buscar
                </button>

            </div>

            <div id="resultadoFase4"></div>

            ${this.pendientesSegunda()}
        `;

    },

    // Solicitudes de más de Q10,000 aprobadas por un administrador y en espera de otro.
    pendientesSegunda() {

        const datos =
            BecasData.obtener();

        const pendientes =
            datos.solicitudes.filter(
                item =>
                    item.fase4.estado ===
                    "pendiente_aprobacion"
            );

        if (!pendientes.length) return "";

        return `

            <div class="panel">

                <span class="eyebrow">
                    MONTOS MAYORES DE Q10,000
                </span>

                <h2>
                    Pendientes de segunda aprobación
                </h2>

                ${pendientes.map(solicitud => {

                    const usuario =
                        datos.usuarios.find(
                            item =>
                                item.usuario ===
                                solicitud.usuario
                        );

                    const propia =
                        solicitud.fase4.aprobadoPor ===
                        usuarioActual.usuario;

                    return `

                        <div class="approval-item">

                            <div class="details-grid">

                                <div>
                                    <span>Aspirante</span>
                                    <strong>${usuario?.nombre ?? solicitud.usuario}</strong>
                                </div>

                                <div>
                                    <span>Monto solicitado</span>
                                    <strong>${this.monto(solicitud)}</strong>
                                </div>

                                <div>
                                    <span>Primera aprobación</span>
                                    <strong>${solicitud.fase4.aprobadoPor}</strong>
                                </div>

                            </div>

                            ${
                                propia
                                ?
                                `
                                    <p class="form-message">
                                        Tú realizaste la primera aprobación.
                                        Otro administrador debe completar la segunda.
                                    </p>
                                `
                                :
                                `
                                    <textarea
                                        id="comentarioSegunda-${solicitud.id}"
                                        rows="2"
                                        placeholder="Comentario (obligatorio para no autorizar)"
                                    ></textarea>

                                    <div class="decision-buttons">

                                        <button
                                            class="btn-success"
                                            onclick="AdminUI.segundaAprobacion('${solicitud.usuario}', ${solicitud.id}, 'aceptada')"
                                        >
                                            ${Iconos.svg("check")} Autorizar
                                        </button>

                                        <button
                                            class="btn-danger"
                                            onclick="AdminUI.segundaAprobacion('${solicitud.usuario}', ${solicitud.id}, 'rechazada')"
                                        >
                                            × No autorizar
                                        </button>

                                    </div>
                                `
                            }

                        </div>
                    `;

                }).join("")}

            </div>
        `;

    },

    async segundaAprobacion(
        usuario,
        id,
        estado
    ) {
        return Operaciones.ejecutar(async () => {

        const comentario =
            document.getElementById(
                `comentarioSegunda-${id}`
            ).value.trim();

        if (estado === "rechazada" && !comentario) {
            throw new Error("Debes agregar un comentario.");
        }

        await BecasData.ejecutar('segunda-aprobacion', {
            usuario,
            estado,
            comentario: comentario || 'Has sido seleccionado para la beca solicitada.'
        });

        mostrarAviso(
            estado === "aceptada"
                ? "Beca autorizada con segunda aprobación."
                : "La solicitud no fue autorizada."
        );

        this.renderFase4();

        });
    },

    monto(solicitud) {

        const valor =
            Number(solicitud.formulario?.monto);

        return Number.isFinite(valor)
            ? "Q" + valor.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "No indicado";

    },

    textoResultado(estado) {

        return estado === "pendiente_aprobacion"
            ? "en segunda aprobación"
            : estado;

    },

    buscarFase4() {

        const dpi =
            document.getElementById(
                "buscarDpiFase4"
            ).value.trim();

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.dpi === dpi
            );

        const contenedor =
            document.getElementById(
                "resultadoFase4"
            );

        if (!solicitud) {

            contenedor.innerHTML =
                `<div class="alert error-alert">
                    Aspirante no encontrado.
                </div>`;

            return;

        }

        const usuario =
            datos.usuarios.find(
                item =>
                    item.usuario ===
                    solicitud.usuario
            );

        const beca =
            datos.becas.find(
                item =>
                    item.id ===
                    solicitud.becaId
            );

        const otorgadas =
            datos.solicitudes.filter(
                item =>
                    item.becaId ===
                        beca.id &&
                    ["aceptada", "pendiente_aprobacion"].includes(
                        item.fase4.estado
                    )
            ).length;

        const disponibles =
            beca.cupos -
            otorgadas;

        contenedor.innerHTML = `

            <div class="panel">

                <span class="eyebrow">
                    EXPEDIENTE
                </span>

                <h2>
                    ${usuario.nombre}
                </h2>

                <div class="details-grid">

                    <div>
                        <span>Formulario</span>
                        <strong>
                            Enviado
                        </strong>
                    </div>

                    <div>
                        <span>Fase 2</span>
                        <strong>
                            ${solicitud.fase2.estado}
                        </strong>
                    </div>

                    <div>
                        <span>Entrevista</span>
                        <strong>
                            ${solicitud.entrevista.estado}
                        </strong>
                    </div>

                    <div>
                        <span>Cupos disponibles</span>
                        <strong>
                            ${disponibles}
                        </strong>
                    </div>

                    <div>
                        <span>Monto solicitado</span>
                        <strong>
                            ${this.monto(solicitud)}
                        </strong>
                    </div>

                    <div>
                        <span>Resultado</span>
                        <strong>
                            ${this.textoResultado(solicitud.fase4.estado)}
                        </strong>
                    </div>

                </div>

                ${
                    solicitud.fase4.estado ===
                    "pendiente_aprobacion"
                    ?
                    `
                        <p class="form-message">
                            Esta solicitud espera la segunda aprobación.
                            Gestiónala en la lista de pendientes.
                        </p>
                    `
                    :
                    ""
                }

                <div class="decision-buttons ${solicitud.fase4.estado === "pendiente_aprobacion" ? "hidden" : ""}">

                    <button
                        class="btn-success"
                        onclick="AdminUI.decisionFinal('${solicitud.usuario}', 'aceptada')"
                    >
                        ${Iconos.svg("check")} Aprobar beca
                    </button>

                    <button
                        class="btn-danger"
                        onclick="AdminUI.mostrarRechazoFinal()"
                    >
                        × No aprobar
                    </button>

                </div>

                <div
                    id="rechazoFinal"
                    class="rejection-box hidden"
                >

                    <textarea
                        id="comentarioFinal"
                        rows="4"
                        placeholder="Motivo de la decisión..."
                    ></textarea>

                    <button
                        class="btn-danger"
                        onclick="AdminUI.decisionFinal('${solicitud.usuario}', 'rechazada')"
                    >
                        Confirmar
                    </button>

                </div>

            </div>
        `;

    },

    mostrarRechazoFinal() {

        document.getElementById(
            "rechazoFinal"
        ).classList.remove(
            "hidden"
        );

    },

    async decisionFinal(
        usuario,
        estado
    ) {
        return Operaciones.ejecutar(async () => {

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.usuario ===
                    usuario
            );

        const beca =
            datos.becas.find(
                item =>
                    item.id ===
                    solicitud.becaId
            );

        if (
            estado ===
            "aceptada"
        ) {

            if (
                solicitud.entrevista.estado !==
                "realizada"
            ) {

                alert(
                    "La entrevista todavía no está marcada como realizada."
                );

                return;

            }

            const otorgadas =
                datos.solicitudes.filter(
                    item =>
                        item.becaId ===
                            beca.id &&
                        item.fase4.estado ===
                            "aceptada"
                ).length;

            if (
                otorgadas >=
                beca.cupos
            ) {

                alert(
                    "Ya no existen cupos disponibles para esta beca."
                );

                return;

            }

            solicitud.fase4.estado =
                "aceptada";

            solicitud.fase4.comentario =
                `Has sido seleccionado para ${beca.nombre}.`;

        } else {

            const comentario =
                document.getElementById(
                    "comentarioFinal"
                ).value.trim();

            if (!comentario) {

                alert(
                    "Debes agregar un comentario."
                );

                return;

            }

            solicitud.fase4.estado =
                "rechazada";

            solicitud.fase4.comentario =
                comentario;

        }

        await BecasData.ejecutar('fase4', { usuario, estado, comentario: estado === 'aceptada' ? 'Has sido seleccionado para la beca solicitada.' : document.getElementById('comentarioFinal').value.trim() });

        const guardada =
            BecasData.obtener().solicitudes.find(
                item =>
                    item.usuario ===
                    usuario
            );

        alert(
            guardada?.fase4.estado === "pendiente_aprobacion"
                ? "Aprobación registrada. Por superar Q10,000, otro administrador debe dar la segunda aprobación."
                : "Decisión final guardada correctamente."
        );

        this.renderFase4();

        });
    },

    renderEstado() {

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Estado de beca";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        CONSULTA
                    </span>

                    <h1>
                        Estado del aspirante
                    </h1>

                </div>

            </div>

            <div class="search-panel">

                <input
                    id="buscarDpiEstado"
                    placeholder="Ingresa el DPI"
                >

                <button
                    class="btn-primary"
                    onclick="AdminUI.buscarEstado()"
                >
                    Consultar
                </button>

            </div>

            <div id="resultadoEstado"></div>
        `;

    },

    buscarEstado() {

        const dpi =
            document.getElementById(
                "buscarDpiEstado"
            ).value.trim();

        const datos =
            BecasData.obtener();

        const solicitud =
            datos.solicitudes.find(
                item =>
                    item.dpi === dpi
            );

        const contenedor =
            document.getElementById(
                "resultadoEstado"
            );

        if (!solicitud) {

            contenedor.innerHTML =
                `<div class="alert error-alert">
                    No se encontró el aspirante.
                </div>`;

            return;

        }

        const usuario =
            datos.usuarios.find(
                item =>
                    item.usuario ===
                    solicitud.usuario
            );

        contenedor.innerHTML = `

            <div class="panel">

                <h2>
                    ${usuario.nombre}
                </h2>

                <div class="timeline">

                    ${this.estadoPaso(
                        "1",
                        "Formulario enviado",
                        solicitud.formularioEnviado
                    )}

                    ${this.estadoPaso(
                        "2",
                        `Fase 2: ${solicitud.fase2.estado}`,
                        solicitud.fase2.estado === "aceptada"
                    )}

                    ${this.estadoPaso(
                        "3",
                        `Entrevista: ${solicitud.entrevista.estado}`,
                        solicitud.entrevista.estado === "realizada"
                    )}

                    ${this.estadoPaso(
                        "4",
                        `Resultado: ${this.textoResultado(solicitud.fase4.estado)}`,
                        solicitud.fase4.estado === "aceptada"
                    )}

                </div>

            </div>
        `;

    },

    renderAuditoria() {

        const registros =
            BecasData.obtener().auditoria ?? [];

        const operaciones = {
            formulario: "Formulario",
            fase2: "Revisión",
            reservar: "Reserva de entrevista",
            entrevista: "Entrevista realizada",
            fase4: "Decisión final",
            "segunda-aprobacion": "Segunda aprobación"
        };

        const estado = valor =>
            valor
                ? valor.replace("resultado-pendiente_aprobacion", "segunda aprobación").replace(/-/g, " ")
                : "—";

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Bitácora";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        AUDITORÍA
                    </span>

                    <h1>
                        Bitácora de solicitudes
                    </h1>

                    <p>
                        Quién realizó cada aprobación, rechazo o modificación,
                        cuándo ocurrió y cuál fue el resultado. Se muestran los
                        500 registros más recientes.
                    </p>

                </div>

            </div>

            ${
                registros.length
                ?
                `
                    <div class="table-wrapper">

                        <table>

                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Realizado por</th>
                                    <th>Operación</th>
                                    <th>Solicitud de</th>
                                    <th>Cambio de estado</th>
                                    <th>Resultado</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${registros.map(item => `
                                    <tr>
                                        <td>${fechaHora(item.fecha)}</td>
                                        <td>${item.actorUsuario} <small>(${nombreRol(item.actorRol)})</small></td>
                                        <td>${operaciones[item.operacion] ?? item.operacion}</td>
                                        <td>${item.usuarioSolicitud || "—"}</td>
                                        <td>${item.resultado === "exito" ? `${estado(item.estadoAnterior)} → ${estado(item.estadoNuevo)}` : "—"}</td>
                                        <td><span class="status-badge ${item.resultado === "exito" ? "green" : "red"}">${item.resultado === "exito" ? "Éxito" : "Rechazado"}</span></td>
                                        <td>${item.detalle}</td>
                                    </tr>
                                `).join("")}
                            </tbody>

                        </table>

                    </div>
                `
                :
                `
                    <section class="empty-state">
                        <h2>Sin registros</h2>
                        <p>Las operaciones sobre solicitudes aparecerán aquí.</p>
                    </section>
                `
            }
        `;

    },

    estadoPaso(
        numero,
        texto,
        completo
    ) {

        return `

            <div class="timeline-step">

                <div
                    class="timeline-circle
                    ${completo ? "done" : ""}"
                >
                    ${numero}
                </div>

                <strong>
                    ${texto}
                </strong>

            </div>
        `;

    }

};

window.AdminUI =
    AdminUI;
