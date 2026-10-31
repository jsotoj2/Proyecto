import mysql from 'mysql2/promise';
import { configuracionMySQL } from './mysql.js';

// El pool se crea al iniciar la aplicación, nunca al importar un servicio.
export function crearConexion(entorno = process.env) {
    return mysql.createPool(configuracionMySQL(entorno));
}
