import { env } from '@/config/env';
import type { IncidentStatus, Page } from '@/domain/incident';

import { createClient, toApiError } from './http';

export type ApiNotificationType = 'NEW_REPORT' | 'STATUS_CHANGED' | 'REJECTED';

/** Aviso tal como lo devuelve el servicio de notificaciones. */
export type ApiNotification = {
  id: string;
  type: ApiNotificationType;
  incidentId: string;
  incidentType: string | null;
  district: string | null;
  incidentStatus: IncidentStatus | null;
  possibleDuplicates: number;
  comment: string | null;
  reportedAt: string | null;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const client = createClient(env.notificationsUrl);

export const notificationApi = {
  async list(page = 0, size = 50): Promise<Page<ApiNotification>> {
    try {
      const { data } = await client.get<Page<ApiNotification>>('/notifications', { params: { page, size } });
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async markRead(id: string): Promise<void> {
    try {
      await client.patch(`/notifications/${id}/read`);
    } catch (error) {
      throw toApiError(error);
    }
  },

  async markAllRead(): Promise<void> {
    try {
      await client.patch('/notifications/read-all');
    } catch (error) {
      throw toApiError(error);
    }
  },
};
