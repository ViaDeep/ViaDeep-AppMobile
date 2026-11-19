import type { IncidentType } from '@/domain/incident';

/** Un daño que el modelo reconoció en la foto, con la caja normalizada a [0, 1]. */
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
  /** Todas las detecciones de la foto (después de NMS), de mayor a menor confianza. */
  detect(imageUri: string): Promise<Detection[]>;
}

/**
 * Motor usado mientras el modelo .onnx no está integrado: no detecta nada, así que la app pide
 * instalar la versión con el modelo antes de reportar.
 */
export const pendingInferenceEngine: InferenceEngine = {
  available: false,
  async detect() {
    return [];
  },
};
