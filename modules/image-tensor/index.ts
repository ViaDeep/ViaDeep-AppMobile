import { requireOptionalNativeModule } from 'expo';

/** Lo que devuelve el letterbox nativo (Kotlin): tensor [1, 3, 640, 640] en bytes float32 y su geometría. */
export type NativeLetterbox = {
  tensor: Uint8Array;
  sourceWidth: number;
  sourceHeight: number;
  resizedWidth: number;
  resizedHeight: number;
  padLeft: number;
  padTop: number;
  decodeMs: number;
  letterboxMs: number;
};

type ImageTensorModule = { letterbox(uri: string): Promise<NativeLetterbox> };

/** null en Expo Go o en un APK anterior a este módulo: ahí la app prepara la foto en JavaScript. */
export default requireOptionalNativeModule<ImageTensorModule>('ImageTensor');
