import type { IncidentType } from '@/domain/incident';

/** Detección con mayor confianza devuelta por el modelo, con la caja normalizada a [0, 1]. */
export type Detection = {
  type: IncidentType;
  confidence: number;
  bboxX: number;
  bboxY: number;
  bboxWidth: number;
  bboxHeight: number;
};

/**
 * Puerto de inferencia on-device. La implementación con ONNX Runtime y el modelo LMD-YOLO se conecta aquí;
 * el resto de la app no depende de cómo se ejecuta el modelo.
 */
export interface InferenceEngine {
  readonly available: boolean;
  detect(imageUri: string): Promise<Detection | null>;
}

/**
 * Motor usado mientras el modelo .onnx no está integrado: no detecta nada, por lo que la app sigue
 * el flujo manual (el ciudadano elige el tipo de daño).
 */
export const pendingInferenceEngine: InferenceEngine = {
  available: false,
  async detect() {
    return null;
  },
};
