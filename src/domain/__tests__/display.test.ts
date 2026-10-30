import { citizenStatus, dayAndClock, formatDateTime, initials, relativeTime, reportCode, statusPhase } from '../display';

describe('citizenStatus', () => {
  it('distingue un reporte pendiente sin severidad (registrada) de uno ya evaluado (en revisión)', () => {
    expect(citizenStatus('PENDING', null)).toBe('REGISTERED');
    expect(citizenStatus('PENDING', 'HIGH')).toBe('IN_REVIEW');
  });

  it('mapea los demás estados del backend', () => {
    expect(citizenStatus('IN_PROGRESS', 'LOW')).toBe('IN_PROGRESS');
    expect(citizenStatus('RESOLVED', null)).toBe('RESOLVED');
    expect(citizenStatus('REJECTED', null)).toBe('REJECTED');
  });

  it('asigna la fase del seguimiento', () => {
    expect(statusPhase('REGISTERED')).toBe(1);
    expect(statusPhase('IN_REVIEW')).toBe(2);
    expect(statusPhase('IN_PROGRESS')).toBe(3);
    expect(statusPhase('RESOLVED')).toBe(4);
  });
});

describe('reportCode', () => {
  it('es estable y usa el año de creación', () => {
    const id = '0000c350-1111-2222-3333-444455556666';
    expect(reportCode(id, '2026-10-14T15:00:00Z')).toBe('REP-2026-LM-50000');
    expect(reportCode(id, '2026-10-14T15:00:00Z')).toBe(reportCode(id, '2026-10-14T16:00:00Z'));
  });

  it('rellena con ceros a 5 dígitos', () => {
    expect(reportCode('00000007-0000-0000-0000-000000000000', '2026-01-02T12:00:00Z')).toBe('REP-2026-LM-00007');
  });
});

describe('fechas', () => {
  const now = new Date(2026, 9, 14, 12, 0);

  it('describe el tiempo relativo', () => {
    expect(relativeTime(new Date(2026, 9, 14, 11, 35).toISOString(), now)).toBe('Hace 25 min');
    expect(relativeTime(new Date(2026, 9, 14, 10, 0).toISOString(), now)).toBe('Hace 2 horas');
    expect(relativeTime(new Date(2026, 9, 13, 18, 0).toISOString(), now)).toBe('Ayer');
    expect(relativeTime(new Date(2026, 4, 3, 9, 0).toISOString(), now)).toBe('03 Mayo');
  });

  it('formatea fecha y hora como en los mockups', () => {
    expect(formatDateTime(new Date(2026, 8, 27, 9, 40).toISOString())).toBe('27/09/2026 · 09:40 AM');
    expect(formatDateTime(new Date(2026, 8, 26, 14, 15).toISOString())).toBe('26/09/2026 · 02:15 PM');
    expect(dayAndClock(new Date(2026, 9, 14, 10, 14).toISOString(), now)).toBe('Hoy · 10:14 hrs');
  });
});

describe('initials', () => {
  it('toma la primera letra del primer y último nombre', () => {
    expect(initials('Carlos Mendoza Rivera')).toBe('CR');
    expect(initials('rodrigo')).toBe('RO');
  });
});
