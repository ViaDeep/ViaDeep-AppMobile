import type { IncidentDetail } from '@/domain/incident';

import type { ApiNotification } from '@/api/notification-api';

import { buildNotifications, mergeNotifications } from '../build-notifications';

const incident: IncidentDetail = {
  id: '00000001-0000-0000-0000-000000000000',
  reporterId: 'r',
  evidenceId: 'e',
  type: 'D40',
  status: 'RESOLVED',
  severity: 'HIGH',
  latitude: -12.09,
  longitude: -77.02,
  district: 'San Isidro',
  description: null,
  aiValidated: true,
  aiResult: null,
  createdAt: '2026-10-10T10:00:00Z',
  updatedAt: '2026-10-13T10:00:00Z',
  possibleDuplicates: [],
  history: [
    { fromStatus: null, toStatus: 'PENDING', changedBy: 'r', comment: null, changedAt: '2026-10-10T10:00:00Z' },
    { fromStatus: 'PENDING', toStatus: 'IN_PROGRESS', changedBy: 'o', comment: 'Cuadrilla asignada', changedAt: '2026-10-11T10:00:00Z' },
    { fromStatus: 'IN_PROGRESS', toStatus: 'RESOLVED', changedBy: 'o', comment: null, changedAt: '2026-10-13T10:00:00Z' },
  ],
};

describe('buildNotifications', () => {
  it('crea un aviso por cambio de estado, del más reciente al más antiguo', () => {
    const items = buildNotifications([incident], null);
    expect(items.map((item) => item.kind)).toEqual(['RESOLVED', 'UPDATED', 'REGISTERED']);
    expect(items[1]).toMatchObject({ status: 'IN_PROGRESS', comment: 'Cuadrilla asignada', code: 'REP-2026-LM-00001' });
    expect(items[2].status).toBe('REGISTERED');
  });

  it('marca como no leídos solo los avisos posteriores a la última visita', () => {
    const items = buildNotifications([incident], '2026-10-12T00:00:00Z');
    expect(items.filter((item) => item.unread).map((item) => item.kind)).toEqual(['RESOLVED']);
  });
});

function serverItem(overrides: Partial<ApiNotification>): ApiNotification {
  return {
    id: 'n1',
    type: 'STATUS_CHANGED',
    incidentId: incident.id,
    incidentType: 'D40',
    district: 'San Isidro',
    incidentStatus: 'IN_PROGRESS',
    possibleDuplicates: 0,
    comment: null,
    reportedAt: incident.createdAt,
    title: 'Tu reporte cambió de estado',
    message: 'Tu reporte de bache en San Isidro ahora está En proceso.',
    createdAt: '2026-10-11T10:00:00Z',
    read: false,
    ...overrides,
  };
}

describe('mergeNotifications', () => {
  it('usa los avisos del servidor y conserva el de reporte registrado armado en el celular', () => {
    const items = mergeNotifications(
      [incident],
      [
        serverItem({ id: 'n2', incidentStatus: 'RESOLVED', createdAt: '2026-10-13T10:00:00Z', read: true }),
        serverItem({ id: 'n1', comment: 'Cuadrilla asignada' }),
      ],
      '2026-10-12T00:00:00Z',
    );
    expect(items.map((item) => [item.kind, item.serverId, item.unread])).toEqual([
      ['RESOLVED', 'n2', false],
      ['UPDATED', 'n1', true],
      ['REGISTERED', undefined, false],
    ]);
    expect(items[1]).toMatchObject({ status: 'IN_PROGRESS', comment: 'Cuadrilla asignada', code: 'REP-2026-LM-00001' });
  });

  it('muestra el rechazo con su motivo e ignora los avisos para operadores', () => {
    const items = mergeNotifications(
      [incident],
      [
        serverItem({ id: 'n3', type: 'REJECTED', incidentStatus: 'REJECTED', comment: 'Foto borrosa' }),
        serverItem({ id: 'n4', type: 'NEW_REPORT', incidentStatus: 'PENDING' }),
      ],
      null,
    );
    expect(items.map((item) => item.kind)).toEqual(['REJECTED', 'REGISTERED']);
    expect(items[0]).toMatchObject({ status: 'REJECTED', comment: 'Foto borrosa' });
  });
});
