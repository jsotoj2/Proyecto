import { describe, expect, test } from 'vitest';
import { cuposOcupados, etapaSolicitud, pasosSolicitud, requiereSegundaAprobacion } from './solicitud.js';
import { crearConstancia, folioSolicitud } from './constanciaPdf.js';

const base = () => ({
    id: 7, usuario: 'ana', dpi: '1234567890123', becaId: 1, fechaFormulario: '2026-10-20', formularioEnviado: true,
    formulario: { nombre: 'Ana Pérez', edad: '20', telefono: '5555 5555', direccion: 'Zona 1, Guatemala', estudios: 'Bachillerato', promedio: '88', monto: '12500', motivo: 'Continuar mi formación universitaria.' },
    fase2: { estado: 'pendiente', comentario: '' },
    entrevista: { estado: 'pendiente', fecha: '', hora: '', modalidad: '' },
    fase4: { estado: 'pendiente', comentario: '', aprobadoPor: '' }
});

describe('etapas de la solicitud', () => {
    test('avanzan según revisión, entrevista y resultado', () => {
        const solicitud = base();
        expect(etapaSolicitud(null)).toBe('formulario');
        expect(etapaSolicitud(solicitud)).toBe('revision');
        solicitud.fase2.estado = 'aceptada';
        expect(etapaSolicitud(solicitud)).toBe('reserva');
        solicitud.entrevista = { estado: 'programada', fecha: '2026-11-02', hora: '09:00', modalidad: 'Virtual' };
        expect(etapaSolicitud(solicitud)).toBe('entrevista');
        solicitud.entrevista.estado = 'realizada';
        expect(etapaSolicitud(solicitud)).toBe('decision');
        solicitud.fase4.estado = 'pendiente_aprobacion';
        expect(etapaSolicitud(solicitud)).toBe('segunda-aprobacion');
        solicitud.fase4.estado = 'aceptada';
        expect(etapaSolicitud(solicitud)).toBe('finalizada');
        expect(pasosSolicitud(solicitud).map(paso => paso.estado)).toEqual(['completo', 'completo', 'completo', 'completo']);
    });

    test('un rechazo en revisión se marca como error en los pasos', () => {
        const solicitud = base();
        solicitud.fase2.estado = 'rechazada';
        expect(etapaSolicitud(solicitud)).toBe('rechazada-revision');
        expect(pasosSolicitud(solicitud)[1].estado).toBe('error');
    });

    test('la segunda aprobación ocupa cupo y aplica sobre Q10,000', () => {
        const aprobada = { ...base(), fase4: { estado: 'aceptada' } };
        const enEspera = { ...base(), id: 8, fase4: { estado: 'pendiente_aprobacion' } };
        expect(cuposOcupados({ solicitudes: [aprobada, enEspera, base()] }, 1)).toBe(2);
        expect(requiereSegundaAprobacion('10000')).toBe(false);
        expect(requiereSegundaAprobacion('10000.01')).toBe(true);
    });
});

describe('constancia PDF', () => {
    test('incluye los datos completados del formulario', () => {
        const solicitud = base();
        const pdf = crearConstancia({ beca: { nombre: 'Beca de Ingeniería' }, solicitud, aspirante: { nombre: 'Ana Pérez', correo: 'ana@correo.gt', dpi: solicitud.dpi } });
        const contenido = pdf.output();
        expect(folioSolicitud(solicitud)).toBe('BN-000007');
        for (const texto of ['BN-000007', 'Beca de Ingenier', '1234567890123', '5555 5555', 'ana@correo.gt', 'Bachillerato', 'Continuar mi formaci']) {
            expect(contenido).toContain(texto);
        }
    });
});
