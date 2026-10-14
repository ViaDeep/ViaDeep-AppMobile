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
};

/**
 * El backend aún no tiene servicio de notificaciones, así que se arman a partir del historial de cada
 * reporte: cada cambio de estado es un aviso, y es "no leído" si ocurrió después de la última vez que
 * el ciudadano abrió la pantalla.
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
