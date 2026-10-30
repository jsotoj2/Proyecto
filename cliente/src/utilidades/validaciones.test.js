import { describe, expect, test } from 'vitest';
import { correo, decimal, dpi, entero, nombre, primerError, requerido, soloDecimal, soloDigitos, soloLetras, telefono, usuario } from './validaciones.js';

describe('validaciones de formularios', () => {
    test('nombres solo con letras', () => {
        expect(nombre('María José Pérez-López')).toBeNull();
        expect(nombre("D'Angelo O’Neil")).toBeNull();
        expect(nombre('Ana 2')).toMatch(/sin números/);
        expect(nombre('Ana@')).toMatch(/sin números/);
    });

    test('correo con formato válido', () => {
        expect(correo('ana.perez@correo.com.gt')).toBeNull();
        for (const malo of ['ana@', 'ana@correo', 'ana correo@x.com', '@correo.com', 'ana@correo.c']) expect(correo(malo)).not.toBeNull();
    });

    test('teléfono de 8 dígitos y DPI de 13', () => {
        expect(telefono('55551234')).toBeNull();
        expect(telefono('5555123')).not.toBeNull();
        expect(telefono('5555-1234')).not.toBeNull();
        expect(dpi('1234567890123')).toBeNull();
        expect(dpi('12345')).not.toBeNull();
    });

    test('números enteros y decimales con rango', () => {
        expect(entero(14, 100)('20')).toBeNull();
        expect(entero(14, 100)('13')).toMatch(/entre 14 y 100/);
        expect(entero(14, 100)('20.5')).toMatch(/entero/);
        expect(decimal(0, 100)('88.75')).toBeNull();
        expect(decimal(0, 100)('88.755')).toMatch(/decimales/);
        expect(decimal(1, 10000000)('0')).toMatch(/entre/);
    });

    test('usuario y reglas combinadas', () => {
        expect(usuario('maria.lopez')).toBeNull();
        expect(usuario('maria lopez')).not.toBeNull();
        expect(primerError([requerido(), telefono], '')).toBe('Este campo es obligatorio.');
        expect(primerError([requerido(), telefono], '123')).toMatch(/8 dígitos/);
    });

    test('limpiadores de entrada', () => {
        expect(soloDigitos(8)('5555-1234 9')).toBe('55551234');
        expect(soloDecimal(2)('1,234.567')).toBe('1.23');
        expect(soloDecimal(2)('12a.5b')).toBe('12.5');
        expect(soloLetras('Ana2 Pé#rez')).toBe('Ana Pérez');
    });
});
