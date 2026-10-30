import estilos from './Marca.module.css';

/** Logotipo de la plataforma. `claro` se usa sobre fondos oscuros. */
export default function Marca({ claro = false, compacta = false }) {
    return (
        <span className={`${estilos.marca} ${claro ? estilos.claro : ''}`}>
            <svg className={estilos.logo} viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="4" className={estilos.fondoLogo} />
                <path d="M6.5 13 16 8l9.5 5-9.5 5-9.5-5Z" className={estilos.trazo} />
                <path d="M10.5 15.5v4.6c0 1.5 2.5 3.1 5.5 3.1s5.5-1.6 5.5-3.1v-4.6" fill="none" strokeWidth="1.8" strokeLinecap="round" className={estilos.linea} />
            </svg>
            {!compacta && (
                <span className={estilos.texto}>
                    <strong>Becas Nacionales</strong>
                    <span>Plataforma Nacional de Becas</span>
                </span>
            )}
        </span>
    );
}
