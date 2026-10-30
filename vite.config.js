import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const entorno = loadEnv(mode, process.cwd(), '');
    // `--mode demo` conecta Vite con la API de demostración (scripts/demo.js) en lugar de la de MySQL.
    const demo = mode === 'demo';
    const servidor = demo ? 'http://127.0.0.1:4173' : `http://${entorno.HOST || '127.0.0.1'}:${entorno.PORT || 3000}`;
    // La API rechaza escrituras cuyo Origin no coincide con APP_ORIGIN; el proxy de desarrollo lo ajusta.
    const origen = demo ? 'http://localhost:4173' : entorno.APP_ORIGIN || servidor;
    return {
        root: 'cliente',
        plugins: [react()],
        build: { outDir: 'dist', emptyOutDir: true },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: servidor,
                    configure: proxy => proxy.on('proxyReq', peticion => {
                        if (peticion.getHeader('origin')) peticion.setHeader('origin', origen);
                    })
                }
            }
        },
        test: { environment: 'jsdom', setupFiles: './src/pruebas/configuracion.js' }
    };
});
