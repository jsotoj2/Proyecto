// Un error esperado conserva su mensaje y código para el adaptador HTTP.
export function errorUsuario(mensaje, estado = 400) {
    throw Object.assign(new Error(mensaje), { estado });
}
