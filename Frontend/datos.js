const DATOS_INICIALES = {

    usuarios: [

        {
            usuario: "alejandro",
            password: "123",
            nombre: "Alejandro Baten",
            correo: "alejandro@email.com",
            dpi: "2999123450101",
            rol: "aspirante",
            activo: true
        },

        {
            usuario: "maria",
            password: "123",
            nombre: "María López",
            correo: "maria@email.com",
            dpi: "2874567890101",
            rol: "aspirante",
            activo: true
        },

        {
            usuario: "admin",
            password: "123",
            nombre: "Carlos Administrador",
            correo: "admin@becas.gt",
            dpi: "",
            rol: "admin",
            activo: true
        },

        {
            usuario: "superadmin",
            password: "123",
            nombre: "Administrador General",
            correo: "superadmin@becas.gt",
            dpi: "",
            rol: "superadmin",
            activo: true
        }

    ],

    becas: [

        {
            id: 1,
            nombre: "Beca de Ingeniería",
            descripcion:
                "Programa dirigido a estudiantes interesados en carreras de ingeniería.",
            requisitos: [
                "Ser graduado de nivel diversificado.",
                "Promedio mínimo de 80 puntos.",
                "Disponibilidad para entrevista.",
                "Presentar información académica."
            ],
            cupos: 15
        },

        {
            id: 2,
            nombre: "Beca de Arquitectura",
            descripcion:
                "Apoyo académico para estudiantes interesados en Arquitectura y Diseño.",
            requisitos: [
                "Promedio mínimo de 80 puntos.",
                "Ser estudiante guatemalteco.",
                "Cumplir con la documentación solicitada."
            ],
            cupos: 10
        },

        {
            id: 3,
            nombre: "Beca de Ciencias Sociales",
            descripcion:
                "Programa enfocado en estudiantes de carreras sociales y humanísticas.",
            requisitos: [
                "Promedio mínimo de 75 puntos.",
                "Completar formulario de solicitud.",
                "Realizar entrevista."
            ],
            cupos: 12
        },

        {
            id: 4,
            nombre: "Beca de Tecnología",
            descripcion:
                "Programa dirigido a futuros profesionales del área tecnológica.",
            requisitos: [
                "Interés en tecnología.",
                "Promedio mínimo de 80 puntos.",
                "Participar en entrevista."
            ],
            cupos: 20
        }

    ],

    descargas: [
        {
            usuario: "maria",
            becaId: 1,
            fecha: "2026-09-08"
        }
    ],

    solicitudes: [

        {
            id: 1,

            usuario: "maria",

            dpi: "2874567890101",

            becaId: 1,

            fechaFormulario: "2026-09-08",

            formularioEnviado: true,

            formulario: {

                nombre: "María López",

                edad: "20",

                telefono: "5555-1111",

                direccion:
                    "Ciudad de Guatemala",

                estudios:
                    "Bachillerato en Computación",

                promedio:
                    "88",

                motivo:
                    "Deseo continuar mis estudios universitarios y desarrollar mi carrera profesional."

            },

            fase2: {

                estado: "pendiente",

                comentario: ""

            },

            entrevista: {

                fecha: "",

                hora: "",

                modalidad: "",

                estado: "pendiente"

            },

            fase4: {

                estado: "pendiente",

                comentario: ""

            }

        }

    ],

    horarios: [

        {
            id: 1,
            fecha: "2026-09-20",
            hora: "09:00",
            modalidad: "Presencial",
            ocupado: false,
            usuario: ""
        },

        {
            id: 2,
            fecha: "2026-09-20",
            hora: "10:00",
            modalidad: "Virtual",
            ocupado: false,
            usuario: ""
        }

    ],

    actividad: [

        {
            texto:
                "María López envió su formulario de solicitud.",
            fecha:
                "08/09/2026"
        }

    ]

};


function obtenerDatos() {

    const datos =
        localStorage.getItem(
            "becas_datos"
        );

    if (!datos) {

        localStorage.setItem(
            "becas_datos",
            JSON.stringify(
                DATOS_INICIALES
            )
        );

        return structuredClone(
            DATOS_INICIALES
        );

    }

    return JSON.parse(datos);

}


function guardarDatos(datos) {

    localStorage.setItem(
        "becas_datos",
        JSON.stringify(datos)
    );

}


function reiniciarDatos() {

    localStorage.setItem(
        "becas_datos",
        JSON.stringify(
            DATOS_INICIALES
        )
    );

}


window.BecasData = {

    obtener:
        obtenerDatos,

    guardar:
        guardarDatos,

    reiniciar:
        reiniciarDatos

};
