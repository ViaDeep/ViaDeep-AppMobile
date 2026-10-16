/** Lado de la imagen que recibe LMD-YOLO: tensor [1, 3, 640, 640]. */
export const MODEL_INPUT_SIZE = 640;

/** Gris del relleno del letterbox de Ultralytics. */
const PAD_VALUE = 114 / 255;

/** Cómo se encaja la foto en el cuadrado de 640 px, para volver luego las cajas a la foto original. */
export type Letterbox = {
  sourceWidth: number;
  sourceHeight: number;
  scale: number;
  resizedWidth: number;
  resizedHeight: number;
  padLeft: number;
  padTop: number;
};

/** Redondeo al entero más cercano con empate al par, como round() de Python. */
function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * Misma geometría que LetterBox de Ultralytics 8.4.153 (auto=false, centrado), descrita en
 * docs/canonical_mobile_preprocessing.md del repositorio LMD-YOLO.
 */
export function letterbox(sourceWidth: number, sourceHeight: number, size = MODEL_INPUT_SIZE): Letterbox {
  const scale = Math.min(size / sourceHeight, size / sourceWidth);
  const resizedWidth = roundHalfEven(sourceWidth * scale);
  const resizedHeight = roundHalfEven(sourceHeight * scale);
  const dw = (size - resizedWidth) / 2;
  const dh = (size - resizedHeight) / 2;
  return {
    sourceWidth,
    sourceHeight,
    scale,
    resizedWidth,
    resizedHeight,
    padLeft: roundHalfEven(dw - 0.1),
    padTop: roundHalfEven(dh - 0.1),
  };
}

/**
 * Arma el tensor NCHW float32 en RGB / 255 a partir de los píxeles RGBA de la foto ya redimensionada a
 * resizedWidth × resizedHeight; el resto del cuadrado queda con el gris 114.
 */
export function toInputTensor(rgba: Uint8Array, box: Letterbox, size = MODEL_INPUT_SIZE): Float32Array {
  if (rgba.length < box.resizedWidth * box.resizedHeight * 4) {
    throw new Error('La imagen redimensionada no tiene el tamaño esperado');
  }
  const plane = size * size;
  const tensor = new Float32Array(3 * plane).fill(PAD_VALUE);
  for (let y = 0; y < box.resizedHeight; y++) {
    const row = (y + box.padTop) * size + box.padLeft;
    for (let x = 0; x < box.resizedWidth; x++) {
      const source = (y * box.resizedWidth + x) * 4;
      const target = row + x;
      tensor[target] = rgba[source] / 255;
      tensor[plane + target] = rgba[source + 1] / 255;
      tensor[2 * plane + target] = rgba[source + 2] / 255;
    }
  }
  return tensor;
}
