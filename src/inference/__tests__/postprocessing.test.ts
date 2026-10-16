import { ANCHORS, bestDetection } from '../postprocessing';
import { letterbox } from '../preprocessing';

function output(anchor: number, box: [number, number, number, number], scores: number[]) {
  const data = new Float32Array(8 * ANCHORS);
  box.forEach((value, row) => (data[row * ANCHORS + anchor] = value));
  scores.forEach((value, c) => (data[(4 + c) * ANCHORS + anchor] = value));
  return data;
}

describe('bestDetection', () => {
  it('devuelve la clase y la caja de mayor puntuación, normalizadas a la foto original', () => {
    const box = letterbox(3000, 4000); // escala 0.16, relleno de 80 px a la izquierda
    const data = output(1234, [320, 320, 160, 320], [0.1, 0.2, 0.05, 0.9]);
    data[(4 + 0) * ANCHORS + 10] = 0.3; // otra caja con menos confianza
    const detection = bestDetection(data, box);
    expect(detection?.type).toBe('D40');
    expect(detection?.confidence).toBeCloseTo(0.9);
    expect(detection?.bboxX).toBeCloseTo((240 - 80) / 0.16 / 3000);
    expect(detection?.bboxY).toBeCloseTo(160 / 0.16 / 4000);
    expect(detection?.bboxWidth).toBeCloseTo(160 / 0.16 / 3000);
    expect(detection?.bboxHeight).toBeCloseTo(320 / 0.16 / 4000);
  });

  it('no devuelve nada si ninguna caja llega al umbral', () => {
    expect(bestDetection(output(0, [10, 10, 5, 5], [0.2, 0.1, 0.1, 0.1]), letterbox(640, 640))).toBeNull();
  });

  it('recorta a la foto las cajas que caen en el relleno', () => {
    const detection = bestDetection(output(5, [80, 320, 100, 100], [0.8, 0, 0, 0]), letterbox(3000, 4000));
    expect(detection?.bboxX).toBe(0);
    expect(detection?.bboxWidth).toBeCloseTo((130 - 80) / 0.16 / 3000);
  });

  it('rechaza una salida con otra forma', () => {
    expect(() => bestDetection(new Float32Array(10), letterbox(640, 640))).toThrow('Salida inesperada');
  });
});
