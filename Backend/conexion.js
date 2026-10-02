// Este archivo se ejecuta en Node.js. No se importa desde el navegador.
import mysql from 'mysql2/promise';
import { configuracionMySQL } from './configuracionMySQL.js';

export const conexion = mysql.createPool(configuracionMySQL());
