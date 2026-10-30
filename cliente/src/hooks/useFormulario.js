import { useCallback, useRef, useState } from 'react';
import { primerError } from '../utilidades/validaciones.js';

/**
 * Estado y validación de un formulario.
 * `esquema` define por campo: { reglas: [...], limpiar?: fn } (ver utilidades/validaciones.js).
 * Los errores se muestran al salir del campo o al intentar enviar, y se actualizan mientras se corrige.
 */
export function useFormulario(inicial, esquema) {
    const [valores, setValores] = useState(inicial);
    const [errores, setErrores] = useState({});
    const tocados = useRef(new Set());

    const errorDe = useCallback((nombre, todos) => primerError(esquema[nombre]?.reglas, todos[nombre], todos), [esquema]);

    function cambiar(evento) {
        const { name, value, type, checked } = evento.target;
        const limpiar = esquema[name]?.limpiar;
        const valor = type === 'checkbox' ? checked : limpiar ? limpiar(value) : value;
        const siguientes = { ...valores, [name]: valor };
        setValores(siguientes);
        if (tocados.current.has(name)) setErrores(previos => ({ ...previos, [name]: errorDe(name, siguientes) }));
    }

    function salir(evento) {
        const { name } = evento.target;
        tocados.current.add(name);
        setErrores(previos => ({ ...previos, [name]: errorDe(name, valores) }));
    }

    /** Valida los campos indicados (o todos). Muestra los errores y enfoca el primero. */
    function validar(campos = Object.keys(esquema)) {
        const nuevos = {};
        for (const nombre of campos) {
            tocados.current.add(nombre);
            nuevos[nombre] = errorDe(nombre, valores);
        }
        setErrores(previos => ({ ...previos, ...nuevos }));
        const primero = campos.find(nombre => nuevos[nombre]);
        if (primero) document.querySelector(`[name="${primero}"]`)?.focus();
        return !primero;
    }

    function reiniciar(nuevos = inicial) {
        tocados.current.clear();
        setErrores({});
        setValores(nuevos);
    }

    /** Propiedades para conectar un <Campo> con el formulario. */
    const campo = nombre => ({ name: nombre, value: valores[nombre] ?? '', onChange: cambiar, onBlur: salir, error: errores[nombre] || undefined });

    return { valores, setValores, errores, cambiar, campo, validar, reiniciar };
}
