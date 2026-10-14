import { FileSystemUploadType, getInfoAsync, uploadAsync } from 'expo-file-system/legacy';

import { env } from '@/config/env';

import { ApiError, createClient, currentToken, notifyUnauthorized, toApiError } from './http';

const client = createClient(env.evidencesUrl);

/** Mismo límite que el servicio de evidencias (EVIDENCE_MAX_SIZE_BYTES). */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function parseJson(text: string): { id?: string; detail?: string } {
  try {
    return JSON.parse(text) as { id?: string; detail?: string };
  } catch {
    return {};
  }
}

export const evidenceApi = {
  /**
   * Sube la foto como multipart (campo "file") con el cargador nativo de Expo, que lee el archivo
   * directo del disco del celular. El fetch de Expo a veces no logra enviar archivos locales.
   */
  async upload(imageUri: string): Promise<string> {
    const info = await getInfoAsync(imageUri).catch(() => null);
    if (info?.exists && info.size > MAX_PHOTO_BYTES) {
      throw new ApiError('La foto pesa más de 10 MB. Toma otra con menos resolución.', 413);
    }
    let response: { status: number; body: string };
    try {
      response = await uploadAsync(`${env.evidencesUrl}/evidences`, imageUri, {
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: 'image/jpeg',
        headers: { Authorization: `Bearer ${currentToken() ?? ''}` },
      });
    } catch (error) {
      const reason = error instanceof Error ? ` (${error.message})` : '';
      throw new ApiError(`No se pudo subir la foto. Revisa tu conexión.${reason}`);
    }
    if (response.status === 401) {
      notifyUnauthorized();
    }
    const body = parseJson(response.body);
    if (response.status < 200 || response.status >= 300) {
      throw new ApiError(body.detail ?? 'No se pudo subir la foto.', response.status);
    }
    if (!body.id) {
      throw new ApiError('No se pudo subir la foto.');
    }
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
