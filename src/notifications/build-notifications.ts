import type { ApiNotification } from '@/api/notification-api';
import { citizenStatus, reportCode, type CitizenStatus } from '@/domain/display';
import type { IncidentDetail } from '@/domain/incident';

export type NotificationKind = 'REGISTERED' | 'UPDATED' | 'RESOLVED' | 'REJECTED';

export type AppNotification = {
  id: string;
  incidentId: string;
  code: string;
  kind: NotificationKind;
  /** Estado al que pasó el reporte, para la etiqueta de la tarjeta. */
  status: CitizenStatus;
  comment: string | null;
  at: string;
  unread: boolean;
  /** Id en el servicio de notificaciones; ausente si el aviso se armó en el celular. */
  serverId?: string;
};

/**
 * Arma los avisos a partir del historial de cada reporte: cada cambio de estado es un aviso, y es
 * "no leído" si ocurrió después de la última vez que el ciudadano abrió la pantalla. Se usa para
 * "Reporte registrado" y como respaldo cuando el servicio de notificaciones no responde.
 */
export function buildNotifications(incidents: IncidentDetail[], seenAt: string | null): AppNotification[] {
  const seen = seenAt ? new Date(seenAt).getTime() : 0;
  const items: AppNotification[] = [];
  for (const incident of incidents) {
    const code = reportCode(incident.id, incident.createdAt);
    incident.history.forEach((entry, index) => {
      const kind: NotificationKind =
        entry.fromStatus === null
          ? 'REGISTERED'
          : entry.toStatus === 'RESOLVED'
            ? 'RESOLVED'
            : entry.toStatus === 'REJECTED'
              ? 'REJECTED'
              : 'UPDATED';
      items.push({
        id: `${incident.id}:${index}`,
        incidentId: incident.id,
        code,
        kind,
        status: citizenStatus(entry.toStatus, entry.toStatus === 'PENDING' ? null : incident.severity),
        comment: entry.comment,
        at: entry.changedAt,
        unread: new Date(entry.changedAt).getTime() > seen,
      });
    });
  }
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/**
 * Combina los avisos del servicio de notificaciones (cambios de estado y rechazos, con su estado de
 * lectura guardado en el servidor) con el aviso "Reporte registrado", que OB2 no envía al ciudadano
 * y por eso se sigue armando en el celular.
 */
export function mergeNotifications(
  incidents: IncidentDetail[],
  server: ApiNotification[],
  seenAt: string | null,
): AppNotification[] {
  const severityById = new Map(incidents.map((incident) => [incident.id, incident.severity]));
  const createdById = new Map(incidents.map((incident) => [incident.id, incident.createdAt]));
  const registered = buildNotifications(incidents, seenAt).filter((item) => item.kind === 'REGISTERED');
  const fromServer = server
    .filter((item) => item.type !== 'NEW_REPORT')
    .map((item): AppNotification => {
      const status = item.incidentStatus ?? (item.type === 'REJECTED' ? 'REJECTED' : 'IN_PROGRESS');
      const kind: NotificationKind =
        item.type === 'REJECTED' || status === 'REJECTED' ? 'REJECTED' : status === 'RESOLVED' ? 'RESOLVED' : 'UPDATED';
      const severity = severityById.get(item.incidentId) ?? null;
      return {
        id: item.id,
        serverId: item.id,
        incidentId: item.incidentId,
        code: reportCode(item.incidentId, item.reportedAt ?? createdById.get(item.incidentId) ?? item.createdAt),
        kind,
        status: citizenStatus(status, status === 'PENDING' ? null : severity),
        comment: item.comment,
        at: item.createdAt,
        unread: !item.read,
      };
    });
  return [...fromServer, ...registered].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
