import type { RegisterIncidentRequest } from '@/api/incident-api';
import type { Detection } from '@/inference/inference-engine';

/** Mismo límite que la columna description del servicio de incidencias. */
export const DESCRIPTION_MAX_LENGTH = 500;

export type Coordinates = { latitude: number; longitude: number };

export type ReportDraft = {
  photoUri: string;
  coordinates: Coordinates;
  /** Resultado de LMD-YOLO; el reporte solo se envía si supera el umbral de confianza. */
  detection: Detection | null;
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

/**
 * Explica al ciudadano por qué no se puede enviar la foto: el tipo de daño lo reconoce siempre el modelo, así que
 * sin modelo en el celular, sin ninguna detección o con una por debajo del umbral hay que tomar otra foto.
 */
export function noDetectionReason(modelAvailable: boolean, detection: Detection | null, threshold: number): string {
  const required = `${Math.round(threshold * 100)} %`;
  if (!modelAvailable) {
    return 'Esta versión de la app no tiene el modelo de IA instalado. Instala la versión más reciente para reportar.';
  }
  if (!detection) {
    return `La IA no reconoció ningún daño en la foto con al menos ${required} de seguridad. Toma otra foto más cerca del daño y con buena luz.`;
  }
  const percent = `${(detection.confidence * 100).toFixed(0)} %`;
  return `La IA solo tuvo ${percent} de seguridad y se necesita al menos ${required}. Toma otra foto más cerca del daño y con buena luz.`;
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
  if (!detection) {
    throw new Error('La IA no reconoció ningún daño en la foto. Toma otra foto antes de enviar el reporte.');
  }
  const { type, ...aiResult } = detection;
  return { ...base, type, aiValidated: true, aiResult };
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
