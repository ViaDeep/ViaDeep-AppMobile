import type { RegisterIncidentRequest } from '@/api/incident-api';
import type { Detection } from '@/inference/inference-engine';
import { MAX_DETECTIONS } from '@/inference/postprocessing';

/** Mismo límite que la columna description del servicio de incidencias. */
export const DESCRIPTION_MAX_LENGTH = 500;

export type Coordinates = { latitude: number; longitude: number };

export type ReportDraft = {
  photoUri: string;
  coordinates: Coordinates;
  /** Todas las detecciones de LMD-YOLO; el reporte solo se envía si al menos una supera el umbral. */
  detections: Detection[];
  description: string;
};

export type ReportDependencies = {
  uploadEvidence: (photoUri: string) => Promise<string>;
  registerIncident: (request: RegisterIncidentRequest) => Promise<{ id: string }>;
  confidenceThreshold: number;
};

/**
 * Separa las detecciones en las que superan el umbral (los daños del reporte) y las que el modelo reconoció con menos
 * confianza, ambas de mayor a menor confianza.
 */
export function splitDetections(detections: Detection[], threshold: number): { accepted: Detection[]; below: Detection[] } {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  return {
    accepted: sorted.filter((d) => d.confidence >= threshold),
    below: sorted.filter((d) => d.confidence < threshold),
  };
}

/** La detección principal del reporte: la de mayor confianza entre las que superan el umbral. */
export function mainDetection(detections: Detection[], threshold: number): Detection | null {
  return splitDetections(detections, threshold).accepted[0] ?? null;
}

/**
 * Explica al ciudadano por qué no se puede enviar la foto: el tipo de daño lo reconoce siempre el modelo, así que
 * sin modelo en el celular, sin ninguna detección o con todas por debajo del umbral hay que tomar otra foto.
 */
export function noDetectionReason(modelAvailable: boolean, detections: Detection[], threshold: number): string {
  const required = `${Math.round(threshold * 100)} %`;
  if (!modelAvailable) {
    return 'Esta versión de la app no tiene el modelo de IA instalado. Instala la versión más reciente para reportar.';
  }
  const best = splitDetections(detections, threshold).below[0];
  if (!best) {
    return `La IA no reconoció ningún daño en la foto. Toma otra foto más cerca del daño y con buena luz.`;
  }
  const percent = `${(best.confidence * 100).toFixed(0)} %`;
  return `La IA reconoció posibles daños, pero el más seguro tuvo ${percent} y se necesita al menos ${required}. Toma otra foto más cerca del daño y con buena luz.`;
}

export function buildIncidentRequest(
  draft: ReportDraft,
  evidenceId: string,
  threshold: number,
): RegisterIncidentRequest {
  const { accepted, below } = splitDetections(draft.detections, threshold);
  const main = accepted[0];
  if (!main) {
    throw new Error('La IA no reconoció ningún daño en la foto. Toma otra foto antes de enviar el reporte.');
  }
  const description = draft.description.trim();
  const { type, ...aiResult } = main;
  return {
    evidenceId,
    latitude: draft.coordinates.latitude,
    longitude: draft.coordinates.longitude,
    ...(description ? { description } : {}),
    type,
    aiValidated: true,
    aiResult,
    detections: [
      ...accepted.map((d) => ({ ...d, accepted: true })),
      ...below.map((d) => ({ ...d, accepted: false })),
    ].slice(0, MAX_DETECTIONS),
  };
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
