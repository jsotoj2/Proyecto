import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const servidor = fileURLToPath(new URL('../servidor/', import.meta.url));
const permitidas = {
    presentacion: ['presentacion', 'compartido'],
    aplicacion: ['aplicacion', 'negocio', 'infraestructura', 'compartido'],
    negocio: ['negocio', 'compartido'],
    datos: ['datos', 'compartido'],
    infraestructura: ['infraestructura', 'compartido'],
    compartido: ['compartido']
};

async function archivos(directorio) {
    const lista = [];
    for (const entrada of await fs.readdir(directorio, { withFileTypes: true })) {
        const archivo = path.join(directorio, entrada.name);
        if (entrada.isDirectory()) lista.push(...await archivos(archivo));
        else if (archivo.endsWith('.js')) lista.push(archivo);
    }
    return lista;
}

test('las dependencias respetan las capas y el negocio no conoce HTTP, SQL ni infraestructura', async () => {
    for (const archivo of await archivos(servidor)) {
        const relativo = path.relative(servidor, archivo);
        const capa = relativo.split(path.sep)[0];
        if (!permitidas[capa]) continue; // iniciar.js es el punto de composición.
        const contenido = await fs.readFile(archivo, 'utf8');
        for (const [, destino] of contenido.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
            if (destino.startsWith('.')) {
                const absoluta = path.resolve(path.dirname(archivo), destino);
                const otra = path.relative(servidor, absoluta).split(path.sep)[0];
                assert(permitidas[capa].includes(otra), `${relativo} no debe depender de ${destino}`);
                await fs.access(absoluta);
            } else if (capa === 'negocio') {
                assert.fail(`${relativo}: negocio debe trabajar con JavaScript puro, sin ${destino}`);
            }
        }
        if (['presentacion', 'aplicacion', 'negocio'].includes(capa)) {
            assert(!/\b(?:SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\b/i.test(contenido), `SQL fuera de datos: ${relativo}`);
        }
    }
});
