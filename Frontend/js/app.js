console.log(
    "app.js cargado correctamente"
);


document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ========================================
        // LOGIN
        // ========================================

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {

            console.log(
                "Formulario de login encontrado"
            );

            loginForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    console.log(
                        "Botón iniciar sesión presionado"
                    );


                    // Verificar que datos.js esté funcionando

                    if (
                        typeof window.BecasData ===
                        "undefined"
                    ) {

                        alert(
                            "ERROR: datos.js no está cargando."
                        );

                        console.error(
                            "BecasData no existe."
                        );

                        return;

                    }


                    const usuario =
                        document
                            .getElementById(
                                "usuario"
                            )
                            .value
                            .trim();

                    const password =
                        document
                            .getElementById(
                                "password"
                            )
                            .value
                            .trim();

                    const mensaje =
                        document.getElementById(
                            "loginMensaje"
                        );


                    console.log(
                        "Usuario ingresado:",
                        usuario
                    );


                    const datos =
                        window.BecasData.obtener();


                    console.log(
                        "Usuarios disponibles:",
                        datos.usuarios
                    );


                    const encontrado =
                        datos.usuarios.find(
                            function (item) {

                                return (
                                    item.usuario ===
                                        usuario &&
                                    item.password ===
                                        password &&
                                    item.activo ===
                                        true
                                );

                            }
                        );


                    if (!encontrado) {

                        mensaje.textContent =
                            "Usuario o contraseña incorrectos.";

                        mensaje.className =
                            "form-message error";

                        return;

                    }


                    console.log(
                        "Login correcto:",
                        encontrado
                    );


                    localStorage.setItem(
                        "becas_session",
                        JSON.stringify({

                            usuario:
                                encontrado.usuario,

                            rol:
                                encontrado.rol

                        })
                    );


                    window.location.href =
                        "dashboard.html";

                }
            );

        }


        // ========================================
        // REGISTRO
        // ========================================

        const registroForm =
            document.getElementById(
                "registroForm"
            );

        if (registroForm) {

            registroForm.addEventListener(
                "submit",
                registrarAspirante
            );

        }


        // ========================================
        // DASHBOARD
        // ========================================

        const dashboardPage =
            document.getElementById(
                "dashboardPage"
            );

        if (dashboardPage) {

            prepararDashboard();

        }

    }
);


// ========================================
// ABRIR REGISTRO
// ========================================

function abrirRegistro() {

    const modal =
        document.getElementById(
            "modalRegistro"
        );

    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


// ========================================
// CERRAR REGISTRO
// ========================================

function cerrarRegistro() {

    const modal =
        document.getElementById(
            "modalRegistro"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


// ========================================
// REGISTRAR ASPIRANTE
// ========================================

function registrarAspirante(evento) {

    evento.preventDefault();


    if (
        typeof window.BecasData ===
        "undefined"
    ) {

        alert(
            "No se pudo cargar datos.js"
        );

        return;

    }


    const datos =
        window.BecasData.obtener();


    const nombre =
        document
            .getElementById(
                "registroNombre"
            )
            .value
            .trim();


    const dpi =
        document
            .getElementById(
                "registroDpi"
            )
            .value
            .trim();


    const correo =
        document
            .getElementById(
                "registroCorreo"
            )
            .value
            .trim();


    const usuario =
        document
            .getElementById(
                "registroUsuario"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "registroPassword"
            )
            .value;


    const mensaje =
        document.getElementById(
            "registroMensaje"
        );


    if (
        dpi.length !==
        13
    ) {

        mensaje.textContent =
            "El DPI debe contener 13 dígitos.";

        mensaje.className =
            "form-message error";

        return;

    }


    const existe =
        datos.usuarios.some(
            function (item) {

                return (
                    item.usuario ===
                        usuario ||
                    item.dpi ===
                        dpi
                );

            }
        );


    if (existe) {

        mensaje.textContent =
            "El usuario o DPI ya está registrado.";

        mensaje.className =
            "form-message error";

        return;

    }


    datos.usuarios.push({

        usuario:
            usuario,

        password:
            password,

        nombre:
            nombre,

        correo:
            correo,

        dpi:
            dpi,

        rol:
            "aspirante",

        activo:
            true

    });


    window.BecasData.guardar(
        datos
    );


    mensaje.textContent =
        "Cuenta creada correctamente. Ya puedes iniciar sesión.";

    mensaje.className =
        "form-message success";


    evento.target.reset();

}


// ========================================
// PREPARAR DASHBOARD
// ========================================

function prepararDashboard() {

    const sesionTexto =
        localStorage.getItem(
            "becas_session"
        );


    if (!sesionTexto) {

        window.location.href =
            "index.html";

        return;

    }


    const sesion =
        JSON.parse(
            sesionTexto
        );


    const datos =
        window.BecasData.obtener();


    const usuario =
        datos.usuarios.find(
            function (item) {

                return (
                    item.usuario ===
                    sesion.usuario
                );

            }
        );


    if (!usuario) {

        cerrarSesion();

        return;

    }


    window.usuarioActual =
        usuario;


    window.sesionActual =
        sesion;


    const badge =
        document.getElementById(
            "userBadge"
        );


    if (badge) {

        badge.innerHTML = `

            <div class="avatar">

                ${usuario.nombre.charAt(0)}

            </div>

            <div>

                <strong>

                    ${usuario.nombre}

                </strong>

                <span>

                    ${nombreRol(usuario.rol)}

                </span>

            </div>
        `;

    }


    navegar(
        "inicio"
    );

}


// ========================================
// NAVEGACIÓN
// ========================================

function navegar(seccion) {

    if (
        seccion ===
        "cuenta"
    ) {

        renderCuenta();

        return;

    }


    if (
        window.sesionActual.rol ===
        "aspirante"
    ) {

        AspiranteUI.render(
            seccion
        );

        return;

    }


    if (
        window.sesionActual.rol ===
        "admin"
    ) {

        AdminUI.render(
            seccion,
            false
        );

        return;

    }


    if (
        window.sesionActual.rol ===
        "superadmin"
    ) {

        SuperAdminUI.render(
            seccion
        );

    }

}


// ========================================
// CERRAR SESIÓN
// ========================================

function cerrarSesion() {

    localStorage.removeItem(
        "becas_session"
    );


    window.location.href =
        "index.html";

}


// ========================================
// NOMBRE DEL ROL
// ========================================

function nombreRol(rol) {

    if (
        rol ===
        "aspirante"
    ) {

        return "Aspirante";

    }


    if (
        rol ===
        "admin"
    ) {

        return "Administrador";

    }


    return "Super Administrador";

}


// ========================================
// MI CUENTA
// ========================================

function renderCuenta() {

    const datos =
        window.BecasData.obtener();


    const usuario =
        datos.usuarios.find(
            function (item) {

                return (
                    item.usuario ===
                    window.sesionActual.usuario
                );

            }
        );


    document.getElementById(
        "pageTitle"
    ).textContent =
        "Mi cuenta";


    document.getElementById(
        "mainContent"
    ).innerHTML = `

        <div class="page-header">

            <div>

                <span class="eyebrow">
                    PERFIL
                </span>

                <h1>
                    Mi cuenta
                </h1>

                <p>
                    Consulta y actualiza tus datos personales.
                </p>

            </div>

        </div>


        <div class="panel">

            <div class="form-grid">


                <div class="form-group">

                    <label>
                        Nombre
                    </label>

                    <input
                        id="cuentaNombre"
                        value="${usuario.nombre}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Usuario
                    </label>

                    <input
                        value="${usuario.usuario}"
                        disabled
                    >

                </div>


                <div class="form-group">

                    <label>
                        Correo
                    </label>

                    <input
                        id="cuentaCorreo"
                        value="${usuario.correo}"
                    >

                </div>


                <div class="form-group">

                    <label>
                        Rol
                    </label>

                    <input
                        value="${nombreRol(usuario.rol)}"
                        disabled
                    >

                </div>


                <div class="form-group full">

                    <label>
                        Nueva contraseña
                    </label>

                    <input
                        id="cuentaPassword"
                        type="password"
                        placeholder="Déjalo vacío si no deseas cambiarla"
                    >

                </div>

            </div>


            <button
                class="btn-primary"
                onclick="guardarCuenta()"
            >
                Guardar cambios
            </button>


            <p
                id="cuentaMensaje"
                class="form-message"
            ></p>

        </div>
    `;

}


// ========================================
// GUARDAR CUENTA
// ========================================

function guardarCuenta() {

    const datos =
        window.BecasData.obtener();


    const usuario =
        datos.usuarios.find(
            function (item) {

                return (
                    item.usuario ===
                    window.sesionActual.usuario
                );

            }
        );


    usuario.nombre =
        document
            .getElementById(
                "cuentaNombre"
            )
            .value
            .trim();


    usuario.correo =
        document
            .getElementById(
                "cuentaCorreo"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "cuentaPassword"
            )
            .value;


    if (password) {

        usuario.password =
            password;

    }


    window.BecasData.guardar(
        datos
    );


    const mensaje =
        document.getElementById(
            "cuentaMensaje"
        );


    mensaje.textContent =
        "Datos actualizados correctamente.";


    mensaje.className =
        "form-message success";

}


// ========================================
// FUNCIONES GLOBALES
// ========================================

window.navegar =
    navegar;

window.cerrarSesion =
    cerrarSesion;

window.abrirRegistro =
    abrirRegistro;

window.cerrarRegistro =
    cerrarRegistro;

window.guardarCuenta =
    guardarCuenta;