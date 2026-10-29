import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource-variable/source-sans-3';
import './estilos/tokens.css';
import './estilos/base.css';
import { SesionProveedor } from './estado/SesionContexto.jsx';
import App from './App.jsx';

createRoot(document.getElementById('raiz')).render(
    <StrictMode>
        <BrowserRouter>
            <SesionProveedor>
                <App />
            </SesionProveedor>
        </BrowserRouter>
    </StrictMode>
);
