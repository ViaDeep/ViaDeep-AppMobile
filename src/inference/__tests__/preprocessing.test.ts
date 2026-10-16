import { letterbox, toInputTensor } from '../preprocessing';

describe('letterbox', () => {
  it('encaja una foto vertical de celular centrándola a lo ancho', () => {
    const box = letterbox(3000, 4000);
    expect(box.scale).toBeCloseTo(0.16);
    expect([box.resizedWidth, box.resizedHeight]).toEqual([480, 640]);
    expect([box.padLeft, box.padTop]).toEqual([80, 0]);
  });

  it('no deja relleno cuando la foto ya es cuadrada', () => {
    const box = letterbox(512, 512);
    expect([box.resizedWidth, box.resizedHeight, box.padLeft, box.padTop]).toEqual([640, 640, 0, 0]);
  });

  it('deja el píxel sobrante del relleno abajo, como Ultralytics', () => {
    // 640 × 427 / 1000 → alto 273, relleno total 367: 183 arriba y 184 abajo.
    const box = letterbox(1000, 427);
    expect(box.resizedHeight).toBe(273);
    expect(box.padTop).toBe(183);
  });
});

describe('toInputTensor', () => {
  it('ordena RGB en planos, divide entre 255 y rellena con gris 114', () => {
    const box = { sourceWidth: 1, sourceHeight: 1, scale: 1, resizedWidth: 1, resizedHeight: 1, padLeft: 1, padTop: 0 };
    const tensor = toInputTensor(new Uint8Array([255, 0, 51, 255]), box, 2);
    // Plano R, G y B de un cuadrado de 2 × 2; el píxel de la foto queda en la columna 1.
    expect(Array.from(tensor)).toEqual([114, 255, 114, 114, 114, 0, 114, 114, 114, 51, 114, 114].map((v) => Math.fround(v / 255)));
  });
});
