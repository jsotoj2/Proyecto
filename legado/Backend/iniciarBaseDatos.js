import fs from 'node:fs/promises';
import {PlataformaRepositorioMySQL} from '../Datos/plataformaRepositorioMySQL.js';
import mysql from 'mysql2/promise';
import { configuracionMySQL } from './configuracionMySQL.js';

let conexion;
try {
    const config = configuracionMySQL();
    const nombre = config.database;
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(nombre)) {
        throw new Error('DB_NAME debe comenzar con una letra y usar solo letras, números o guion bajo (máximo 64 caracteres).');
    }
    delete config.database;
    conexion = await mysql.createConnection(config);
    await conexion.query(`CREATE DATABASE IF NOT EXISTS \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conexion.query(`USE \`${nombre}\``);
    const contenido = await fs.readFile(new URL('./esquema.sql', import.meta.url), 'utf8');
    const sentencias = contenido.replace(/^\s*--.*$/gm, '').split(';').map(sql => sql.trim()).filter(Boolean);
    for (const sql of sentencias) await conexion.query(sql);
    await new PlataformaRepositorioMySQL(conexion).preparar();
    console.log('Base de datos preparada. Plataforma con usuarios, sesiones, fases y documentos disponible.');
} catch (error) {
    console.error('No se pudo preparar la base de datos.');
    if (error.code === 'ER_DBACCESS_DENIED_ERROR' || error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Revisa el usuario y sus permisos. También puedes crear becas_app desde el panel de Aiven y ejecutar esquema.sql desde DBeaver.');
    } else if (error.code) {
        console.error(`Código: ${error.code}. Revisa las credenciales, el puerto y el certificado CA.`);
    } else { console.error(error.message); }
    process.exitCode = 1;
} finally { if (conexion) await conexion.end(); }
