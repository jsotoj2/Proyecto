const SuperAdminUI = {

    render(seccion) {

        if (
            seccion ===
            "usuarios"
        ) {

            AdminUI.renderMenu(true);

            this.renderUsuarios();

            return;

        }

        if (
            seccion ===
            "cupos"
        ) {

            AdminUI.renderMenu(true);

            this.renderCupos();

            return;

        }

        if (
            seccion ===
            "estadisticas"
        ) {

            AdminUI.renderMenu(true);

            this.renderEstadisticas();

            return;

        }

        AdminUI.render(
            seccion,
            true
        );

    },


    renderUsuarios() {

        const datos =
            BecasData.obtener();

        const filas =
            datos.usuarios.map(
                usuario => `

                    <tr>

                        <td>
                            ${usuario.nombre}
                        </td>

                        <td>
                            ${usuario.usuario}
                        </td>

                        <td>
                            ${usuario.correo}
                        </td>

                        <td>
                            ${usuario.rol}
                        </td>

                        <td>

                            ${
                                usuario.activo
                                ?
                                `<span class="status-badge green">Activo</span>`
                                :
                                `<span class="status-badge red">Inactivo</span>`
                            }

                        </td>

                        <td>

                            <button
                                class="table-button"
                                onclick="SuperAdminUI.cambiarEstado('${usuario.usuario}')"
                            >
                                Activar / Desactivar
                            </button>

                        </td>

                    </tr>

                `
            ).join("");

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Usuarios";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        SUPER ADMIN
                    </span>

                    <h1>
                        Gestión de usuarios
                    </h1>

                    <p>
                        Crea y administra las cuentas
                        de la plataforma.
                    </p>

                </div>

            </div>

            <div class="panel">

                <h3>
                    Crear usuario
                </h3>

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Nombre
                        </label>

                        <input id="nuevoNombre">

                    </div>

                    <div class="form-group">

                        <label>
                            Correo
                        </label>

                        <input
                            id="nuevoCorreo"
                            type="email"
                        >

                    </div>

                    <div class="form-group">

                        <label>
                            Usuario
                        </label>

                        <input id="nuevoUsuario">
<label>DPI (13 dígitos para aspirantes)</label><input id="nuevoDpi" maxlength="13">

                    </div>

                    <div class="form-group">

                        <label>
                            Contraseña
                        </label>

                        <input
                            id="nuevoPassword"
                            type="password"
                        >

                    </div>

                    <div class="form-group full">

                        <label>
                            Rol
                        </label>

                        <select id="nuevoRol">

                            <option value="aspirante">
                                Aspirante
                            </option>

                            <option value="admin">
                                Administrador
                            </option>

                        </select>

                    </div>

                </div>

                <button
                    class="btn-primary"
                    onclick="SuperAdminUI.crearUsuario()"
                >
                    Crear usuario
                </button>

            </div>

            <div class="panel table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acción</th>

                        </tr>

                    </thead>

                    <tbody>
                        ${filas}
                    </tbody>

                </table>

            </div>
        `;

    },


    async crearUsuario() {

        const nombre =
            document.getElementById(
                "nuevoNombre"
            ).value.trim();

        const correo =
            document.getElementById(
                "nuevoCorreo"
            ).value.trim();

        const usuario =
            document.getElementById(
                "nuevoUsuario"
            ).value.trim();

        const password =
            document.getElementById(
                "nuevoPassword"
            ).value;

        const rol =
            document.getElementById(
                "nuevoRol"
            ).value;

        if (
            !nombre ||
            !correo ||
            !usuario ||
            !password
        ) {

            alert(
                "Completa todos los campos."
            );

            return;

        }

        const datos =
            BecasData.obtener();

        if (
            datos.usuarios.some(
                item =>
                    item.usuario === usuario
            )
        ) {

            alert(
                "Ese usuario ya existe."
            );

            return;

        }

        datos.usuarios.push({

            nombre,
            correo,
            usuario,
            password,
            rol,

            dpi: document.getElementById("nuevoDpi").value.trim(),

            activo:
                true

        });

        await BecasData.guardar(datos);

        this.renderUsuarios();

    },


    async cambiarEstado(usuario) {

        if (
            usuario ===
            sesionActual.usuario
        ) {

            alert(
                "No puedes desactivar tu propia cuenta."
            );

            return;

        }

        const datos =
            BecasData.obtener();

        const encontrado =
            datos.usuarios.find(
                item =>
                    item.usuario ===
                    usuario
            );

        encontrado.activo =
            !encontrado.activo;

        await BecasData.guardar(datos);

        this.renderUsuarios();

    },


    renderCupos() {

        const datos =
            BecasData.obtener();

        const becas =
            datos.becas.map(
                beca => {

                    const otorgadas =
                        datos.solicitudes.filter(
                            item =>
                                item.becaId ===
                                    beca.id &&
                                item.fase4.estado ===
                                    "aceptada"
                        ).length;

                    return `

                        <div class="capacity-card">

                            <div>

                                <h3>
                                    ${beca.nombre}
                                </h3>

                                <p>
                                    Otorgadas:
                                    <strong>
                                        ${otorgadas}
                                    </strong>
                                </p>

                            </div>

                            <div class="capacity-control">

                                <label>
                                    Cupos disponibles
                                </label>

                                <input
                                    id="cupo-${beca.id}"
                                    type="number"
                                    min="0"
                                    value="${beca.cupos}"
                                >

                                <button
                                    class="btn-primary"
                                    onclick="SuperAdminUI.guardarCupo(${beca.id})"
                                >
                                    Guardar
                                </button>

                            </div>

                        </div>
                    `;

                }
            ).join("");

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Cupos de becas";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        SUPER ADMIN
                    </span>

                    <h1>
                        Administración de cupos
                    </h1>

                    <p>
                        Define cuántas becas pueden
                        otorgarse por convocatoria.
                    </p>

                </div>

            </div>

            <div class="capacity-list">

                ${becas}

            </div>
        `;

    },


    async guardarCupo(id) {

        const valor =
            Number(
                document.getElementById(
                    `cupo-${id}`
                ).value
            );

        if (
            valor < 0
        ) {
            return;
        }

        const datos =
            BecasData.obtener();

        const beca =
            datos.becas.find(
                item =>
                    item.id === id
            );

        beca.cupos =
            valor;

        await BecasData.guardar(datos);

        alert(
            "Cupos actualizados."
        );

    },


    renderEstadisticas() {

        const datos =
            BecasData.obtener();

        const aspirantes =
            datos.usuarios.filter(
                item =>
                    item.rol ===
                    "aspirante"
            ).length;

        const descargas =
            datos.descargas.length;

        const enviados =
            datos.solicitudes.filter(
                item =>
                    item.formularioEnviado
            ).length;

        const aceptados =
            datos.solicitudes.filter(
                item =>
                    item.fase4.estado ===
                    "aceptada"
            ).length;

        const rechazados =
            datos.solicitudes.filter(
                item =>
                    item.fase4.estado ===
                    "rechazada"
            ).length;

        document.getElementById(
            "pageTitle"
        ).textContent =
            "Estadísticas generales";

        document.getElementById(
            "mainContent"
        ).innerHTML = `

            <div class="page-header">

                <div>

                    <span class="eyebrow">
                        ANÁLISIS GENERAL
                    </span>

                    <h1>
                        Estadísticas de la plataforma
                    </h1>

                    <p>
                        Vista general del comportamiento
                        de las convocatorias.
                    </p>

                </div>

            </div>

            <div class="stats-grid">

                ${AdminUI.stat(
                    "Aspirantes registrados",
                    aspirantes,
                    "👥"
                )}

                ${AdminUI.stat(
                    "Formularios descargados",
                    descargas,
                    "⬇"
                )}

                ${AdminUI.stat(
                    "Formularios enviados",
                    enviados,
                    "📄"
                )}

                ${AdminUI.stat(
                    "Becas otorgadas",
                    aceptados,
                    "🎓"
                )}

            </div>

            <div class="analytics-grid">

                <div class="panel">

                    <h3>
                        Formularios
                    </h3>

                    ${this.barra(
                        "Descargados",
                        descargas,
                        Math.max(
                            descargas,
                            enviados,
                            1
                        )
                    )}

                    ${this.barra(
                        "Enviados",
                        enviados,
                        Math.max(
                            descargas,
                            enviados,
                            1
                        )
                    )}

                </div>

                <div class="panel">

                    <h3>
                        Resultado final
                    </h3>

                    ${this.barra(
                        "Aceptados",
                        aceptados,
                        Math.max(
                            aceptados,
                            rechazados,
                            1
                        )
                    )}

                    ${this.barra(
                        "Rechazados",
                        rechazados,
                        Math.max(
                            aceptados,
                            rechazados,
                            1
                        )
                    )}

                </div>

            </div>

            <div class="panel">

                <h3>
                    Actividad reciente
                </h3>

                <div class="activity-list">

                    ${
                        datos.actividad
                            .slice(0, 10)
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
                            ).join("")
                    }

                </div>

            </div>
        `;

    },


    barra(
        nombre,
        valor,
        maximo
    ) {

        const porcentaje =
            Math.round(
                valor /
                maximo *
                100
            );

        return `

            <div class="chart-row">

                <div class="chart-label">

                    <span>
                        ${nombre}
                    </span>

                    <strong>
                        ${valor}
                    </strong>

                </div>

                <div class="chart-track">

                    <div
                        class="chart-fill"
                        style="width:${porcentaje}%"
                    ></div>

                </div>

            </div>
        `;

    }

};


window.SuperAdminUI =
    SuperAdminUI;