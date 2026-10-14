let conexion;
try {
    const { crearConexion } = await import('../servidor/configuracion/conexion.js');
    conexion = crearConexion();
    const [filas] = await conexion.query('SELECT 1 AS ok');
    // mysql2 puede devolver enteros grandes como texto según su configuración.
    if (Number(filas[0]?.ok) !== 1) throw new Error('MySQL respondió con un resultado inesperado.');
    console.log('Conexión a MySQL correcta. Esta prueba no crea tablas ni modifica datos.');
} catch (error) {
    const mensajes = {
        ER_ACCESS_DENIED_ERROR: 'Revisa usuario, contraseña y permisos para conectarte desde tu equipo.',
        ER_BAD_DB_ERROR: 'Revisa DB_NAME: la base de datos indicada no existe o tiene otro nombre.',
        ENOTFOUND: 'Revisa DB_HOST: no se pudo encontrar el servidor.',
        ECONNREFUSED: 'El servidor rechazó la conexión. Revisa host, puerto y acceso externo.',
        ETIMEDOUT: 'La conexión tardó demasiado. Revisa el firewall y la lista de IP permitidas.',
        HANDSHAKE_SSL_ERROR: 'Revisa los requisitos TLS y el certificado CA del proveedor.',
        CERT_HAS_EXPIRED: 'El certificado TLS está vencido. Revisa el certificado y la fecha del equipo.',
        ERR_MODULE_NOT_FOUND: 'Instala el conector desde la raíz con npm ci.'
    };
    // No mostramos objetos de conexión ni credenciales en la consola.
    console.error('No se pudo verificar la conexión.');
    console.error(mensajes[error.code] || (error.code ? `Código: ${error.code}. Revisa la configuración del proveedor.` : error.message));
    process.exitCode = 1;
} finally {
    if (conexion) await conexion.end();
}
