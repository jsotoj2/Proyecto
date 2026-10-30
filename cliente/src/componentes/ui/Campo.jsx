import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import estilos from './Campo.module.css';

/**
 * Campo de formulario con etiqueta, ayuda y error asociados por ARIA.
 * `como` elige el control: input (predeterminado), textarea o select (con `children` como opciones).
 * `icono` muestra un ícono decorativo al inicio del control.
 */
export default function Campo({ etiqueta, ayuda, error, como = 'input', completo = false, opcional = false, icono: Icono, id, className = '', children, ...resto }) {
    const generado = useId();
    const idCampo = id ?? generado;
    const descripciones = [ayuda && `${idCampo}-ayuda`, error && `${idCampo}-error`].filter(Boolean).join(' ') || undefined;
    const propiedades = { id: idCampo, className: estilos.control, 'aria-describedby': descripciones, 'aria-invalid': error ? true : undefined, ...resto };

    let control;
    if (como === 'textarea') control = <textarea rows={5} {...propiedades} />;
    else if (como === 'select') control = <select {...propiedades}>{children}</select>;
    else if (resto.type === 'password') control = <CampoContrasena {...propiedades} />;
    else control = <input {...propiedades} />;

    return (
        <div className={`${estilos.campo} ${completo ? estilos.completo : ''} ${className}`}>
            <label htmlFor={idCampo} className={estilos.etiqueta}>
                {etiqueta}
                {opcional && <span className={estilos.opcional}> (opcional)</span>}
            </label>
            {Icono ? (
                <div className={estilos.conIcono}>
                    <Icono className={estilos.icono} size={18} aria-hidden="true" />
                    {control}
                </div>
            ) : control}
            {ayuda && <small id={`${idCampo}-ayuda`} className={estilos.ayuda}>{ayuda}</small>}
            {error && <small id={`${idCampo}-error`} className={estilos.error}>{error}</small>}
        </div>
    );
}

function CampoContrasena(propiedades) {
    const [visible, setVisible] = useState(false);
    return (
        <div className={estilos.contrasena}>
            <input {...propiedades} type={visible ? 'text' : 'password'} />
            <button
                type="button"
                className={estilos.mostrar}
                onClick={() => setVisible(valor => !valor)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={visible}
            >
                {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
        </div>
    );
}

export function RejillaCampos({ children }) {
    return <div className={estilos.rejilla}>{children}</div>;
}
