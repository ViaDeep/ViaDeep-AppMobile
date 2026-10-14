import { env } from '@/config/env';

import { ApiError, createClient, currentToken, notifyUnauthorized, toApiError } from './http';

const client = createClient(env.evidencesUrl);

export const evidenceApi = {
  /**
   * Sube la foto como multipart (campo "file"). Se usa fetch porque maneja mejor los archivos locales
   * de React Native que axios.
   */
  async upload(imageUri: string): Promise<string> {
    const form = new FormData();
    form.append('file', { uri: imageUri, name: 'evidencia.jpg', type: 'image/jpeg' } as unknown as Blob);
    let response: Response;
    try {
      response = await fetch(`${env.evidencesUrl}/evidences`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken() ?? ''}` },
        body: form,
      });
    } catch {
      throw new ApiError('No se pudo subir la foto. Revisa tu conexión.');
    }
    if (response.status === 401) {
      notifyUnauthorized();
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new ApiError(body.detail ?? 'No se pudo subir la foto.', response.status);
    }
    const body = (await response.json()) as { id: string };
    return body.id;
  },

  async signedUrl(evidenceId: string): Promise<string> {
    try {
      const { data } = await client.get<{ url: string }>(`/evidences/${evidenceId}/url`);
      return data.url;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
