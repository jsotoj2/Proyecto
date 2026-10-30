import { Compass } from 'lucide-react';
import { useTitulo } from '../hooks/useTitulo.js';
import { EstadoVacio } from '../componentes/ui/Pagina.jsx';
import Boton from '../componentes/ui/Boton.jsx';

export default function NoEncontrada() {
    useTitulo('Página no encontrada');
    return (
        <div style={{ padding: 'var(--espacio-8) var(--espacio-4)', maxWidth: 640, margin: '0 auto' }}>
            <EstadoVacio icono={Compass} titulo="No encontramos esta página" accion={<Boton a="/panel">Volver al inicio</Boton>}>
                La dirección no existe o ya no está disponible.
            </EstadoVacio>
        </div>
    );
}
