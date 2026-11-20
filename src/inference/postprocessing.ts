import { INCIDENT_TYPES } from '@/domain/incident';

import type { Detection } from './inference-engine';
import type { Letterbox } from './preprocessing';

/** Confianza mínima para aceptar una detección, la misma del golden de LMD-YOLO. */
export const CONFIDENCE_THRESHOLD = 0.25;

/** Anclas de salida del modelo a 640 px: 80² + 40² + 20². */
export const ANCHORS = 8400;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** IoU sobre el que dos cajas de la misma clase se consideran el mismo daño (el valor por defecto de Ultralytics). */
export const IOU_THRESHOLD = 0.7;

/** Máximo de detecciones que se devuelven por foto (el backend guarda como máximo 20). */
export const MAX_DETECTIONS = 20;

type Candidate = { anchor: number; cls: number; score: number; x1: number; y1: number; x2: number; y2: number };

function iou(a: Candidate, b: Candidate): number {
  const width = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const height = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  if (width <= 0 || height <= 0) return 0;
  const inter = width * height;
  const union = (a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Lee la salida [1, 8, 8400] (cx, cy, w, h en píxeles del cuadrado de 640 y la puntuación de cada una de las 4 clases)
 * y devuelve todas las detecciones de la foto, de mayor a menor confianza, con la caja normalizada a la foto original.
 * Igual que Ultralytics: cada ancla se queda con su clase de mayor puntuación, se descartan las menores a `threshold`
 * y la supresión de no máximos (NMS) se hace por clase, así un bache dentro de una zona de piel de cocodrilo se
 * conserva como otra detección.
 */
export function detectAll(
  output: Float32Array,
  box: Letterbox,
  threshold = CONFIDENCE_THRESHOLD,
  iouThreshold = IOU_THRESHOLD,
  maxDetections = MAX_DETECTIONS,
): Detection[] {
  const classes = INCIDENT_TYPES.length;
  if (output.length !== (4 + classes) * ANCHORS) {
    throw new Error(`Salida inesperada del modelo: ${output.length} valores`);
  }
  const candidates: Candidate[] = [];
  for (let i = 0; i < ANCHORS; i++) {
    let cls = 0;
    let score = output[4 * ANCHORS + i];
    for (let c = 1; c < classes; c++) {
      const value = output[(4 + c) * ANCHORS + i];
      if (value > score) {
        score = value;
        cls = c;
      }
    }
    if (score < threshold) continue;
    const cx = output[i];
    const cy = output[ANCHORS + i];
    const w = output[2 * ANCHORS + i];
    const h = output[3 * ANCHORS + i];
    candidates.push({ anchor: i, cls, score, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2 });
  }
  candidates.sort((a, b) => b.score - a.score);

  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    if (kept.length >= maxDetections) break;
    if (kept.some((other) => other.cls === candidate.cls && iou(other, candidate) > iouThreshold)) continue;
    kept.push(candidate);
  }
  return kept.map((candidate) => toDetection(candidate, box));
}

/** La detección de mayor confianza (la que sobrevive siempre a la NMS), o null si ninguna supera `threshold`. */
export function bestDetection(output: Float32Array, box: Letterbox, threshold = CONFIDENCE_THRESHOLD): Detection | null {
  return detectAll(output, box, threshold, IOU_THRESHOLD, 1)[0] ?? null;
}

function toDetection(candidate: Candidate, box: Letterbox): Detection {
  const left = clamp((candidate.x1 - box.padLeft) / box.scale / box.sourceWidth);
  const top = clamp((candidate.y1 - box.padTop) / box.scale / box.sourceHeight);
  const right = clamp((candidate.x2 - box.padLeft) / box.scale / box.sourceWidth);
  const bottom = clamp((candidate.y2 - box.padTop) / box.scale / box.sourceHeight);
  return {
    type: INCIDENT_TYPES[candidate.cls],
    confidence: candidate.score,
    bboxX: left,
    bboxY: top,
    bboxWidth: right - left,
    bboxHeight: bottom - top,
  };
}
