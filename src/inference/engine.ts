import { pendingInferenceEngine, type InferenceEngine } from './inference-engine';
import { onnxInferenceEngine, onnxRuntimeInstalled } from './onnx-engine';

/**
 * Motor que usa la app: LMD-YOLO con ONNX Runtime cuando la app trae ese código nativo (APK de ViaDeep). En Expo Go,
 * donde ONNX Runtime no existe, no hay detección y la app no puede enviar reportes.
 */
export const inferenceEngine: InferenceEngine = onnxRuntimeInstalled ? onnxInferenceEngine : pendingInferenceEngine;
