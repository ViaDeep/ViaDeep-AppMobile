import { pendingInferenceEngine, type InferenceEngine } from './inference-engine';

/**
 * Motor que usa la app. Cuando el modelo LMD-YOLO en ONNX esté listo, se reemplaza aquí por la
 * implementación con ONNX Runtime y el resto de pantallas no cambia.
 */
export const inferenceEngine: InferenceEngine = pendingInferenceEngine;
