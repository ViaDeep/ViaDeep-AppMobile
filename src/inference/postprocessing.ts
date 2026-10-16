import { INCIDENT_TYPES } from '@/domain/incident';

import type { Detection } from './inference-engine';
import type { Letterbox } from './preprocessing';

/** Confianza mínima para aceptar una detección, la misma del golden de LMD-YOLO. */
export const CONFIDENCE_THRESHOLD = 0.25;

/** Anclas de salida del modelo a 640 px: 80² + 40² + 20². */
export const ANCHORS = 8400;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Lee la salida [1, 8, 8400] (cx, cy, w, h en píxeles del cuadrado de 640 y la puntuación de cada una de las 4 clases)
 * y devuelve la detección con mayor confianza, con la caja normalizada a la foto original. Como la app guarda solo
 * esa detección, no hace falta NMS: la caja de mayor puntuación siempre sobrevive a la supresión.
 */
export function bestDetection(output: Float32Array, box: Letterbox, threshold = CONFIDENCE_THRESHOLD): Detection | null {
  const classes = INCIDENT_TYPES.length;
  if (output.length !== (4 + classes) * ANCHORS) {
    throw new Error(`Salida inesperada del modelo: ${output.length} valores`);
  }
  let bestScore = -1;
  let bestAnchor = -1;
  let bestClass = -1;
  for (let c = 0; c < classes; c++) {
    const offset = (4 + c) * ANCHORS;
    for (let i = 0; i < ANCHORS; i++) {
      if (output[offset + i] > bestScore) {
        bestScore = output[offset + i];
        bestAnchor = i;
        bestClass = c;
      }
    }
  }
  if (bestScore < threshold) return null;

  const cx = output[bestAnchor];
  const cy = output[ANCHORS + bestAnchor];
  const w = output[2 * ANCHORS + bestAnchor];
  const h = output[3 * ANCHORS + bestAnchor];
  const left = clamp((cx - w / 2 - box.padLeft) / box.scale / box.sourceWidth);
  const top = clamp((cy - h / 2 - box.padTop) / box.scale / box.sourceHeight);
  const right = clamp((cx + w / 2 - box.padLeft) / box.scale / box.sourceWidth);
  const bottom = clamp((cy + h / 2 - box.padTop) / box.scale / box.sourceHeight);
  return {
    type: INCIDENT_TYPES[bestClass],
    confidence: bestScore,
    bboxX: left,
    bboxY: top,
    bboxWidth: right - left,
    bboxHeight: bottom - top,
  };
}
