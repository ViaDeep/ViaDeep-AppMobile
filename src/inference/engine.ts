import { pendingInferenceEngine, type InferenceEngine } from './inference-engine';
import { onnxInferenceEngine, onnxRuntimeInstalled } from './onnx-engine';

/**
 * Motor que usa la app: LMD-YOLO con ONNX Runtime cuando la app trae ese código nativo (APK de ViaDeep), o el modo
 * manual en Expo Go, donde ONNX Runtime no existe.
 */
export const inferenceEngine: InferenceEngine = onnxRuntimeInstalled ? onnxInferenceEngine : pendingInferenceEngine;
