import { Asset } from 'expo-asset';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { NativeModules } from 'react-native';
import UPNG from 'upng-js';

import ImageTensor from '../../modules/image-tensor';

import type { Detection, InferenceEngine } from './inference-engine';
import { bestDetection } from './postprocessing';
import { letterbox, MODEL_INPUT_SIZE, toInputTensor, type Letterbox } from './preprocessing';

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

/** Milisegundos de la decodificación y del letterbox dentro del código nativo. */
export type NativeTimes = { decode: number; letterbox: number };

type Pixels = { box: Letterbox; tensor: () => Float32Array; native: NativeTimes | null };

/** Redimensiona la foto con el letterbox de LMD-YOLO y devuelve sus píxeles RGBA (camino en JavaScript). */
async function readPixelsJs(imageUri: string): Promise<Pixels> {
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
  return { box, tensor: () => toInputTensor(rgba, box), native: null };
}

/**
 * Prepara la foto en Kotlin (módulo ImageTensor): el tensor llega armado y aquí solo se lee como float32. En un APK
 * sin ese módulo, o si falla, se usa el camino en JavaScript; `native` queda en null para saber cuál se usó.
 */
async function readPixels(imageUri: string): Promise<Pixels> {
  if (!ImageTensor) return readPixelsJs(imageUri);
  try {
    return await readPixelsNative(ImageTensor, imageUri);
  } catch {
    return readPixelsJs(imageUri);
  }
}

async function readPixelsNative(module: NonNullable<typeof ImageTensor>, imageUri: string): Promise<Pixels> {
  const result = await module.letterbox(imageUri);
  const box: Letterbox = {
    sourceWidth: result.sourceWidth,
    sourceHeight: result.sourceHeight,
    scale: Math.min(MODEL_INPUT_SIZE / result.sourceHeight, MODEL_INPUT_SIZE / result.sourceWidth),
    resizedWidth: result.resizedWidth,
    resizedHeight: result.resizedHeight,
    padLeft: result.padLeft,
    padTop: result.padTop,
  };
  const length = 3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  if (result.tensor.byteLength !== length * 4) throw new Error('El tensor de la foto no tiene el tamaño esperado');
  const bytes = result.tensor;
  // Float32Array necesita un inicio múltiplo de 4; si no lo es, se copia.
  const tensor = () =>
    bytes.byteOffset % 4 === 0 ? new Float32Array(bytes.buffer, bytes.byteOffset, length) : new Float32Array(bytes.slice().buffer);
  return { box, tensor, native: { decode: result.decodeMs, letterbox: result.letterboxMs } };
}

/** Milisegundos de cada etapa de una detección, para medir la latencia en el celular. */
export type StageTimes = { pixels: number; tensor: number; inference: number; postprocess: number; total: number };

/** Ejecuta el mismo camino que `detect` sobre una foto y cronometra cada etapa. */
export async function timedDetect(
  imageUri: string,
): Promise<{ detection: Detection | null; times: StageTimes; native: NativeTimes | null }> {
  const model = await loadSession();
  if (!ort) throw new Error('ONNX Runtime no está disponible');
  const t0 = performance.now();
  const { box, tensor, native } = await readPixels(imageUri);
  const t1 = performance.now();
  const input: Tensor = new ort.Tensor('float32', tensor(), [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
  const t2 = performance.now();
  const result = await model.run({ [model.inputNames[0]]: input });
  const t3 = performance.now();
  const detection = bestDetection(result[model.outputNames[0]].data as Float32Array, box);
  const t4 = performance.now();
  return {
    detection,
    times: { pixels: t1 - t0, tensor: t2 - t1, inference: t3 - t2, postprocess: t4 - t3, total: t4 - t0 },
    native,
  };
}

/** Milisegundos que tarda en cargar el modelo la primera vez (0 si ya estaba cargado). */
export async function sessionLoadTime(): Promise<number> {
  const started = performance.now();
  await loadSession();
  return performance.now() - started;
}

/** LMD-YOLO en el celular con ONNX Runtime (CPU). */
export const onnxInferenceEngine: InferenceEngine = {
  available: true,
  async detect(imageUri: string): Promise<Detection | null> {
    const [model, { box, tensor }] = await Promise.all([loadSession(), readPixels(imageUri)]);
    if (!ort) throw new Error('ONNX Runtime no está disponible');
    const input: Tensor = new ort.Tensor('float32', tensor(), [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
    const result = await model.run({ [model.inputNames[0]]: input });
    const output = result[model.outputNames[0]];
    return bestDetection(output.data as Float32Array, box);
  },
};
