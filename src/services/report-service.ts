import type { RegisterIncidentRequest } from '@/api/incident-api';
import type { IncidentType } from '@/domain/incident';
import type { Detection } from '@/inference/inference-engine';

export type Coordinates = { latitude: number; longitude: number };

export type ReportDraft = {
  photoUri: string;
  coordinates: Coordinates;
  detection: Detection | null;
  /** Tipo elegido por el ciudadano; obligatorio cuando no hay detección válida. */
  manualType: IncidentType | null;
  description: string;
};

export type ReportDependencies = {
  uploadEvidence: (photoUri: string) => Promise<string>;
  registerIncident: (request: RegisterIncidentRequest) => Promise<{ id: string }>;
  confidenceThreshold: number;
};

/** Una detección solo cuenta como validación por IA si supera el umbral de confianza. */
export function acceptedDetection(detection: Detection | null, threshold: number): Detection | null {
  return detection && detection.confidence >= threshold ? detection : null;
}

export function buildIncidentRequest(
  draft: ReportDraft,
  evidenceId: string,
  threshold: number,
): RegisterIncidentRequest {
  const detection = acceptedDetection(draft.detection, threshold);
  const description = draft.description.trim();
  const base = {
    evidenceId,
    latitude: draft.coordinates.latitude,
    longitude: draft.coordinates.longitude,
    ...(description ? { description } : {}),
  };
  if (detection) {
    const { type, ...aiResult } = detection;
    return { ...base, type, aiValidated: true, aiResult };
  }
  if (!draft.manualType) {
    throw new Error('Elige el tipo de daño antes de enviar el reporte.');
  }
  return { ...base, type: draft.manualType, aiValidated: false };
}

/**
 * Envía el reporte en dos pasos: primero la foto al servicio de evidencias y luego la incidencia,
 * que referencia la evidencia por su id.
 */
export async function submitReport(draft: ReportDraft, deps: ReportDependencies): Promise<string> {
  // Se valida antes de subir la foto para no dejar evidencias huérfanas.
  buildIncidentRequest(draft, 'validation', deps.confidenceThreshold);
  const evidenceId = await deps.uploadEvidence(draft.photoUri);
  const { id } = await deps.registerIncident(buildIncidentRequest(draft, evidenceId, deps.confidenceThreshold));
  return id;
}
