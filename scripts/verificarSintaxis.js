import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

async function revisar(directorio) {
    for (const entrada of await fs.readdir(directorio, { withFileTypes: true })) {
        const archivo = path.join(directorio, entrada.name);
        if (entrada.isDirectory()) await revisar(archivo);
        else if (entrada.name.endsWith('.js')) {
            const resultado = spawnSync(process.execPath, ['--check', archivo], { encoding: 'utf8' });
            if (resultado.status !== 0) throw new Error(resultado.stderr || `No se pudo verificar ${archivo}`);
        }
    }
}
// El código del cliente (JSX) se verifica al compilar con `npm run build`.
for (const directorio of ['servidor', 'scripts', 'pruebas']) await revisar(directorio);
console.log('Sintaxis JavaScript correcta.');
