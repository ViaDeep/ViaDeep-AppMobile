import { ANCHORS, bestDetection, detectAll } from '../postprocessing';
import { letterbox } from '../preprocessing';

function output(anchor: number, box: [number, number, number, number], scores: number[], data = new Float32Array(8 * ANCHORS)) {
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

describe('detectAll', () => {
  const square = letterbox(640, 640);

  it('devuelve todos los daños de la foto, de mayor a menor confianza', () => {
    const data = output(1, [480, 100, 300, 200], [0, 0, 0.95, 0]); // piel de cocodrilo
    output(2, [200, 120, 150, 150], [0, 0, 0, 0.6], data); // bache al lado
    output(3, [320, 500, 600, 40], [0.3, 0, 0, 0], data); // grieta débil
    const detections = detectAll(data, square);
    expect(detections.map((d) => d.type)).toEqual(['D20', 'D40', 'D00']);
    expect(detections[1].confidence).toBeCloseTo(0.6);
  });

  it('une las cajas casi iguales de la misma clase y conserva las de otra clase', () => {
    const data = output(1, [320, 320, 200, 200], [0, 0, 0, 0.9]);
    output(2, [322, 321, 200, 200], [0, 0, 0, 0.8], data); // mismo bache, otra ancla
    output(3, [320, 320, 200, 200], [0, 0, 0.7, 0], data); // misma zona, otra clase
    const detections = detectAll(data, square);
    expect(detections.map((d) => [d.type, Number(d.confidence.toFixed(2))])).toEqual([
      ['D40', 0.9],
      ['D20', 0.7],
    ]);
  });

  it('cada ancla cuenta una vez, con su clase de mayor puntuación', () => {
    const detections = detectAll(output(1, [320, 320, 100, 100], [0.4, 0.5, 0, 0]), square);
    expect(detections).toHaveLength(1);
    expect(detections[0].type).toBe('D10');
  });

  it('no pasa del máximo de detecciones', () => {
    const data = new Float32Array(8 * ANCHORS);
    for (let i = 0; i < 30; i++) output(i, [20 + i * 20, 20, 10, 10], [0.5, 0, 0, 0], data);
    expect(detectAll(data, square)).toHaveLength(20);
  });
});
