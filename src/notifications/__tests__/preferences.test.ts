import type { AppNotification } from '../build-notifications';
import { applyPreferences, DEFAULT_PREFERENCES, parsePreferences } from '../preferences';

function notification(kind: AppNotification['kind']): AppNotification {
  return {
    id: kind,
    incidentId: 'i',
    code: 'REP-2026-LM-00001',
    kind,
    status: 'REGISTERED',
    comment: null,
    at: '2026-10-14T10:00:00Z',
    unread: true,
  };
}

describe('preferencias de avisos', () => {
  it('activa todo si no hay nada guardado o el valor está dañado', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('no-es-json')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('{"RESOLVED": "si"}')).toEqual(DEFAULT_PREFERENCES);
  });

  it('respeta lo guardado y completa lo que falte', () => {
    expect(parsePreferences('{"UPDATED": false}')).toEqual({ ...DEFAULT_PREFERENCES, UPDATED: false });
  });

  it('oculta los tipos de aviso desactivados', () => {
    const items = [notification('REGISTERED'), notification('UPDATED'), notification('RESOLVED'), notification('REJECTED')];
    const visible = applyPreferences(items, { ...DEFAULT_PREFERENCES, REGISTERED: false, REJECTED: false });
    expect(visible.map((item) => item.kind)).toEqual(['UPDATED', 'RESOLVED']);
  });
});
