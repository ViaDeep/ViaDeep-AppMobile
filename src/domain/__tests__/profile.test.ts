import { formatPhone, validatePasswordChange, validateProfile } from '../profile';

describe('validateProfile', () => {
  it('acepta nombre solo o con celular y DNI válidos', () => {
    expect(validateProfile({ fullName: 'Ana Quispe', phone: '', documentNumber: '' })).toEqual({});
    expect(validateProfile({ fullName: 'Ana', phone: '987654321', documentNumber: '45678912' })).toEqual({});
  });

  it('marca cada campo inválido', () => {
    expect(validateProfile({ fullName: '  ', phone: '12345', documentNumber: '1234' })).toEqual({
      fullName: 'Ingresa tu nombre.',
      phone: 'Debe tener 9 dígitos y empezar con 9.',
      documentNumber: 'El DNI tiene 8 dígitos.',
    });
  });
});

describe('validatePasswordChange', () => {
  it('pide que la nueva contraseña sea válida, confirmada y distinta', () => {
    expect(validatePasswordChange({ current: '', next: 'x', confirm: 'x' })).toBe('Completa los tres campos.');
    expect(validatePasswordChange({ current: 'actual123', next: 'corta', confirm: 'corta' })).toMatch(/8 caracteres/);
    expect(validatePasswordChange({ current: 'actual123', next: 'nueva1234', confirm: 'nueva12345' })).toMatch(/no coincide/);
    expect(validatePasswordChange({ current: 'actual123', next: 'actual123', confirm: 'actual123' })).toMatch(/distinta/);
    expect(validatePasswordChange({ current: 'actual123', next: 'nueva1234', confirm: 'nueva1234' })).toBeNull();
  });
});

describe('formatPhone', () => {
  it('agrupa un celular de 9 dígitos de tres en tres', () => {
    expect(formatPhone('987654321')).toBe('987 654 321');
  });

  it('deja igual un número con otro formato', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});
