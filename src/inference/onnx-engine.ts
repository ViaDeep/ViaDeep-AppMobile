import { Asset } from 'expo-asset';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { NativeModules } from 'react-native';
import UPNG from 'upng-js';

import type { Detection, InferenceEngine } from './inference-engine';
import { bestDetection } from './postprocessing';
import { letterbox, MODEL_INPUT_SIZE, toInputTensor } from './preprocessing';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const MODEL = require('../../assets/models/lmd-yolo.onnx');

type Ort = typeof import('onnxruntime-react-native');

/**
 * ONNX Runtime es código nativo: existe en el APK de ViaDeep, pero no en Expo Go. Sin él, la app sigue en modo
 * manual en lugar de cerrarse al importar la librería.
 */
export const onnxRuntimeInstalled = NativeModules.Onnxruntime != null;

let ort: Ort | null = null;
let session: Promise<InferenceSession> | null = null;

function loadSession(): Promise<InferenceSession> {
  if (!session) {
    session = (async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ort = require('onnxruntime-react-native') as Ort;
      const [asset] = await Asset.loadAsync(MODEL);
      const path = (asset.localUri ?? asset.uri).replace(/^file:\/\//, '');
      return ort.InferenceSession.create(path, { executionProviders: ['cpu'] });
    })();
    // Si falla la carga, el siguiente intento vuelve a probar en lugar de quedarse con el error.
    session.catch(() => {
      session = null;
    });
  }
  return session;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Redimensiona la foto con el letterbox de LMD-YOLO y devuelve sus píxeles RGBA. */
async function readPixels(imageUri: string) {
  const original = await ImageManipulator.manipulate(imageUri).renderAsync();
  const box = letterbox(original.width, original.height, MODEL_INPUT_SIZE);
  const resized = await ImageManipulator.manipulate(imageUri).resize({ width: box.resizedWidth, height: box.resizedHeight }).renderAsync();
  // PNG para no sumar pérdida de JPEG antes del modelo.
  const png = await resized.saveAsync({ format: SaveFormat.PNG, base64: true });
  if (!png.base64) throw new Error('No se pudo leer la foto');
  const decoded = UPNG.decode(base64ToBytes(png.base64).buffer as ArrayBuffer);
  if (decoded.width !== box.resizedWidth || decoded.height !== box.resizedHeight) {
    throw new Error('La foto redimensionada no tiene el tamaño esperado');
  }
  const rgba = new Uint8Array(UPNG.toRGBA8(decoded)[0]);
  return { box, rgba };
}

/** LMD-YOLO en el celular con ONNX Runtime (CPU). */
export const onnxInferenceEngine: InferenceEngine = {
  available: true,
  async detect(imageUri: string): Promise<Detection | null> {
    const [model, { box, rgba }] = await Promise.all([loadSession(), readPixels(imageUri)]);
    if (!ort) throw new Error('ONNX Runtime no está disponible');
    const input: Tensor = new ort.Tensor('float32', toInputTensor(rgba, box), [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
    const result = await model.run({ [model.inputNames[0]]: input });
    const output = result[model.outputNames[0]];
    return bestDetection(output.data as Float32Array, box);
  },
};
