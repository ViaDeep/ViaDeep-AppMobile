import { pendingInferenceEngine, type InferenceEngine } from './inference-engine';
import { onnxInferenceEngine, onnxRuntimeInstalled } from './onnx-engine';

/**
 * Motor que usa la app: LMD-YOLO con ONNX Runtime cuando la app trae ese código nativo (APK de ViaDeep), o un motor
 * sin modelo en Expo Go, donde ONNX Runtime no existe (ahí no se puede reportar).
 */
export const inferenceEngine: InferenceEngine = onnxRuntimeInstalled ? onnxInferenceEngine : pendingInferenceEngine;
