import { env } from '@/config/env';
import type { AiResult, IncidentDetail, IncidentSummary, IncidentType, Page } from '@/domain/incident';

import { createClient, toApiError } from './http';

export type RegisterIncidentRequest = {
  evidenceId: string;
  type: IncidentType;
  latitude: number;
  longitude: number;
  description?: string;
  aiValidated: boolean;
  aiResult?: AiResult;
};

const client = createClient(env.incidentsUrl);

export const incidentApi = {
  async register(request: RegisterIncidentRequest): Promise<{ id: string }> {
    try {
      const { data } = await client.post<{ id: string }>('/incidents', request);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Para un ciudadano el backend devuelve solo sus propios reportes. */
  async mine(page = 0, size = 20): Promise<Page<IncidentSummary>> {
    try {
      const { data } = await client.get<Page<IncidentSummary>>('/incidents', { params: { page, size } });
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async detail(id: string): Promise<IncidentDetail> {
    try {
      const { data } = await client.get<IncidentDetail>(`/incidents/${id}`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
