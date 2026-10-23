import { devServerHost, withDevHost } from '../dev-host';

describe('devServerHost', () => {
  it('quita el puerto y el esquema', () => {
    expect(devServerHost('192.168.1.40:8090')).toBe('192.168.1.40');
    expect(devServerHost('exp://10.0.0.5:8090/--/x')).toBe('10.0.0.5');
  });

  it('devuelve null sin servidor de desarrollo', () => {
    expect(devServerHost(undefined)).toBeNull();
    expect(devServerHost('')).toBeNull();
  });
});

describe('withDevHost', () => {
  it('reemplaza una IP vieja por la IP actual de la PC', () => {
    expect(withDevHost('http://192.168.1.37:8081', '192.168.0.12')).toBe('http://192.168.0.12:8081');
    expect(withDevHost('http://localhost:8083/evidences', '10.0.0.5')).toBe('http://10.0.0.5:8083/evidences');
  });

  it('no toca un backend en internet', () => {
    expect(withDevHost('https://api.viadeep.pe', '192.168.0.12')).toBe('https://api.viadeep.pe');
  });

  it('no usa un host de Expo que no sea local (túnel)', () => {
    expect(withDevHost('http://192.168.1.37:8081', 'abc.exp.direct')).toBe('http://192.168.1.37:8081');
  });

  it('sin servidor de desarrollo deja la URL igual', () => {
    expect(withDevHost('http://192.168.1.37:8081', null)).toBe('http://192.168.1.37:8081');
  });
});
