import { useState } from 'react';
import { Power, Search, UserPlus, Users } from 'lucide-react';
import { useDatos } from '../../estado/useDatos.js';
import { useSesion } from '../../estado/SesionContexto.jsx';
import { useOperacion } from '../../hooks/useOperacion.js';
import { useFormulario } from '../../hooks/useFormulario.js';
import { CAMPOS_CUENTA, dpi, soloDigitos } from '../../utilidades/validaciones.js';
import { useTitulo } from '../../hooks/useTitulo.js';
import { confirmar } from '../../componentes/alertas/alertas.js';
import { nombreRol, normalizar } from '../../utilidades/formato.js';
import { EncabezadoPagina, EstadoVacio } from '../../componentes/ui/Pagina.jsx';
import Campo, { RejillaCampos } from '../../componentes/ui/Campo.jsx';
import Tarjeta from '../../componentes/ui/Tarjeta.jsx';
import Boton from '../../componentes/ui/Boton.jsx';
import Insignia from '../../componentes/ui/Insignia.jsx';
import estilos from '../admin/Admin.module.css';

const VACIO = { nombre: '', correo: '', usuario: '', password: '', rol: 'aspirante', dpi: '' };
const ESQUEMA = {
    ...CAMPOS_CUENTA,
    // El DPI solo es obligatorio para aspirantes; si se escribe para un administrador, debe ser válido.
    dpi: { reglas: [(valor, valores) => (valores.rol === 'aspirante' && !valor ? 'Escribe el DPI del aspirante.' : null), dpi], limpiar: soloDigitos(13) }
};

function NuevoUsuario() {
    const { ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();
    const { valores: cuenta, campo, validar, reiniciar } = useFormulario(VACIO, ESQUEMA);

    async function crear(evento) {
        evento.preventDefault();
        if (!validar()) return;
        const datos = { ...cuenta, nombre: cuenta.nombre.trim(), correo: cuenta.correo.trim(), usuario: cuenta.usuario.trim() };
        const listo = await ejecutar(() => ejecutarOperacion('crear-usuario', { usuario: datos }), {
            tituloError: 'No se pudo crear el usuario',
            exito: { titulo: 'Usuario creado', texto: `${datos.nombre} ya puede iniciar sesión como ${nombreRol(datos.rol).toLowerCase()}.` }
        });
        if (listo) reiniciar();
    }

    return (
        <Tarjeta titulo="Crear usuario" descripcion="Registra administradores o aspirantes. Las cuentas superadministradoras se crean desde el servidor." como="form" onSubmit={crear} noValidate>
            <div className="pila" style={{ gap: 'var(--espacio-5)' }}>
                <RejillaCampos>
                    <Campo etiqueta="Nombre completo" {...campo('nombre')} maxLength={160} />
                    <Campo etiqueta="Correo electrónico" {...campo('correo')} type="email" maxLength={254} />
                    <Campo etiqueta="Usuario" {...campo('usuario')} maxLength={40} autoComplete="off" />
                    <Campo etiqueta="Contraseña" {...campo('password')} type="password" autoComplete="new-password" ayuda="Mínimo 8 caracteres." />
                    <Campo etiqueta="Rol" {...campo('rol')} como="select">
                        <option value="aspirante">Aspirante</option>
                        <option value="admin">Administrador</option>
                    </Campo>
                    <Campo
                        etiqueta="DPI / CUI"
                        {...campo('dpi')}
                        inputMode="numeric"
                        maxLength={13}
                        placeholder="13 dígitos"
                        opcional={cuenta.rol !== 'aspirante'}
                        ayuda={cuenta.rol === 'aspirante' ? 'Obligatorio para aspirantes.' : undefined}
                    />
                </RejillaCampos>
                <div className="fila">
                    <Boton type="submit" icono={UserPlus} cargando={ejecutando}>Crear usuario</Boton>
                </div>
            </div>
        </Tarjeta>
    );
}

export default function Usuarios() {
    useTitulo('Usuarios');
    const { usuario: actual } = useSesion();
    const { datos, ejecutar: ejecutarOperacion } = useDatos();
    const { ejecutando, ejecutar } = useOperacion();
    const [filtros, setFiltros] = useState({ texto: '', rol: '' });
    const cambiar = evento => setFiltros(previos => ({ ...previos, [evento.target.name]: evento.target.value }));

    const consulta = normalizar(filtros.texto);
    const visibles = datos.usuarios.filter(item =>
        (!filtros.rol || item.rol === filtros.rol)
        && (!consulta || [item.nombre, item.usuario, item.correo, item.dpi].some(valor => normalizar(valor).includes(consulta))));

    async function cambiarEstado(cuenta) {
        const activar = !cuenta.activo;
        const aceptado = await confirmar({
            titulo: activar ? `¿Activar a ${cuenta.nombre}?` : `¿Desactivar a ${cuenta.nombre}?`,
            texto: activar ? 'La cuenta podrá iniciar sesión de nuevo.' : 'La cuenta no podrá iniciar sesión hasta que se active nuevamente.',
            textoConfirmar: activar ? 'Activar' : 'Desactivar',
            peligro: !activar,
            icono: 'warning'
        });
        if (!aceptado) return;
        await ejecutar(() => ejecutarOperacion('activar-usuario', { usuario: cuenta.usuario, activo: activar }), {
            exito: { titulo: activar ? 'Cuenta activada' : 'Cuenta desactivada' }
        });
    }

    return (
        <div className="pila">
            <EncabezadoPagina antetitulo="Superadministración" titulo="Gestión de usuarios" descripcion="Crea y administra las cuentas de la plataforma." />
            <NuevoUsuario />

            <Tarjeta titulo="Cuentas registradas" descripcion={`${datos.usuarios.length} usuarios en total.`} relleno={false}>
                <div style={{ padding: '0 var(--espacio-6) var(--espacio-5)' }}>
                    <div className={estilos.filtros}>
                        <div className={estilos.buscador}>
                            <Search size={18} aria-hidden="true" />
                            <Campo etiqueta="Buscar" type="search" name="texto" value={filtros.texto} onChange={cambiar} placeholder="Nombre, usuario, correo o DPI" />
                        </div>
                        <Campo etiqueta="Rol" como="select" name="rol" value={filtros.rol} onChange={cambiar}>
                            <option value="">Todos los roles</option>
                            <option value="aspirante">Aspirantes</option>
                            <option value="admin">Administradores</option>
                            <option value="superadmin">Superadministradores</option>
                        </Campo>
                    </div>
                </div>
                {visibles.length ? (
                    <div className="tabla-contenedor integrada">
                        <table className="tabla">
                            <thead>
                                <tr><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th className="celda-acciones">Acción</th></tr>
                            </thead>
                            <tbody>
                                {visibles.map(cuenta => {
                                    const protegida = cuenta.usuario === actual.usuario || cuenta.rol === 'superadmin';
                                    return (
                                        <tr key={cuenta.usuario}>
                                            <td><strong>{cuenta.nombre}</strong>{cuenta.dpi && <small>DPI {cuenta.dpi}</small>}</td>
                                            <td>{cuenta.usuario}</td>
                                            <td>{cuenta.correo}</td>
                                            <td>{nombreRol(cuenta.rol)}</td>
                                            <td>{cuenta.activo ? <Insignia tono="exito">Activo</Insignia> : <Insignia tono="error">Inactivo</Insignia>}</td>
                                            <td className="celda-acciones">
                                                {protegida
                                                    ? <span className="texto-suave texto-pequeno">{cuenta.usuario === actual.usuario ? 'Tu cuenta' : 'Protegida'}</span>
                                                    : (
                                                        <Boton variante={cuenta.activo ? 'peligro' : 'secundario'} tamano="sm" icono={Power} disabled={ejecutando} onClick={() => cambiarEstado(cuenta)}>
                                                            {cuenta.activo ? 'Desactivar' : 'Activar'}
                                                        </Boton>
                                                    )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '0 var(--espacio-6) var(--espacio-6)' }}>
                        <EstadoVacio icono={Users} titulo="Ningún usuario coincide">Prueba con otro nombre o rol.</EstadoVacio>
                    </div>
                )}
            </Tarjeta>
        </div>
    );
}
