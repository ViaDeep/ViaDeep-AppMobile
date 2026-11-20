import type { Detection } from '@/inference/inference-engine';
import {
  buildIncidentRequest,
  mainDetection,
  noDetectionReason,
  splitDetections,
  submitReport,
  type ReportDraft,
} from '@/services/report-service';

const detection: Detection = { type: 'D40', confidence: 0.82, bboxX: 0.1, bboxY: 0.2, bboxWidth: 0.3, bboxHeight: 0.4 };
const crocodile: Detection = { type: 'D20', confidence: 0.957, bboxX: 0.6, bboxY: 0, bboxWidth: 0.4, bboxHeight: 0.35 };
const weakCrack: Detection = { type: 'D00', confidence: 0.42, bboxX: 0, bboxY: 0.5, bboxWidth: 1, bboxHeight: 0.1 };

function draft(overrides: Partial<ReportDraft> = {}): ReportDraft {
  return {
    photoUri: 'file:///foto.jpg',
    coordinates: { latitude: -12.0464, longitude: -77.0428 },
    detections: [],
    description: '',
    ...overrides,
  };
}

describe('splitDetections', () => {
  it('separa los daños que superan el umbral de los que no, de mayor a menor confianza', () => {
    const { accepted, below } = splitDetections([weakCrack, detection, crocodile], 0.7);
    expect(accepted).toEqual([crocodile, detection]);
    expect(below).toEqual([weakCrack]);
    expect(mainDetection([weakCrack, detection, crocodile], 0.7)).toEqual(crocodile);
  });

  it('cuenta como aceptada una detección justo en el umbral', () => {
    expect(splitDetections([{ ...detection, confidence: 0.7 }], 0.7).accepted).toHaveLength(1);
  });
});

describe('buildIncidentRequest', () => {
  it('usa la detección de mayor confianza como principal y envía todas las detecciones', () => {
    const request = buildIncidentRequest(draft({ detections: [weakCrack, detection, crocodile] }), 'ev-1', 0.7);

    expect(request).toEqual({
      evidenceId: 'ev-1',
      type: 'D20',
      latitude: -12.0464,
      longitude: -77.0428,
      aiValidated: true,
      aiResult: { confidence: 0.957, bboxX: 0.6, bboxY: 0, bboxWidth: 0.4, bboxHeight: 0.35 },
      detections: [
        { ...crocodile, accepted: true },
        { ...detection, accepted: true },
        { ...weakCrack, accepted: false },
      ],
    });
  });

  it('no arma el reporte si ninguna detección alcanza el umbral', () => {
    expect(() => buildIncidentRequest(draft({ detections: [weakCrack] }), 'ev-1', 0.7)).toThrow('Toma otra foto');
  });

  it('no arma el reporte si no hay detección', () => {
    expect(() => buildIncidentRequest(draft(), 'ev-1', 0.7)).toThrow('La IA no reconoció ningún daño');
  });

  it('envía la descripción sin espacios y la omite si está vacía', () => {
    const detections = [detection];
    expect(buildIncidentRequest(draft({ detections, description: '  frente al paradero ' }), 'ev', 0.7).description).toBe(
      'frente al paradero',
    );
    expect(buildIncidentRequest(draft({ detections, description: '   ' }), 'ev', 0.7)).not.toHaveProperty('description');
  });
});

describe('submitReport', () => {
  it('sube la foto y luego registra la incidencia con el id de la evidencia', async () => {
    const uploadEvidence = jest.fn().mockResolvedValue('ev-42');
    const registerIncident = jest.fn().mockResolvedValue({ id: 'inc-7' });

    const id = await submitReport(draft({ detections: [detection] }), {
      uploadEvidence,
      registerIncident,
      confidenceThreshold: 0.7,
    });

    expect(id).toBe('inc-7');
    expect(uploadEvidence).toHaveBeenCalledWith('file:///foto.jpg');
    expect(registerIncident).toHaveBeenCalledWith(expect.objectContaining({ evidenceId: 'ev-42', type: 'D40', aiValidated: true }));
  });

  it('no sube la foto si la IA no detectó un daño', async () => {
    const uploadEvidence = jest.fn();

    await expect(
      submitReport(draft({ detections: [weakCrack] }), { uploadEvidence, registerIncident: jest.fn(), confidenceThreshold: 0.7 }),
    ).rejects.toThrow();
    expect(uploadEvidence).not.toHaveBeenCalled();
  });
});

describe('noDetectionReason', () => {
  const low: Detection = { type: 'D40', confidence: 0.347, bboxX: 0, bboxY: 0, bboxWidth: 1, bboxHeight: 1 };

  it('avisa si el celular no tiene el modelo', () => {
    expect(noDetectionReason(false, [], 0.7)).toBe(
      'Esta versión de la app no tiene el modelo de IA instalado. Instala la versión más reciente para reportar.',
    );
  });

  it('avisa si la IA no encontró ningún daño', () => {
    expect(noDetectionReason(true, [], 0.7)).toBe(
      'La IA no reconoció ningún daño en la foto. Toma otra foto más cerca del daño y con buena luz.',
    );
  });

  it('muestra la seguridad del daño más probable y la necesaria cuando ninguno llega al umbral', () => {
    expect(noDetectionReason(true, [low, weakCrack], 0.7)).toBe(
      'La IA reconoció posibles daños, pero el más seguro tuvo 42 % y se necesita al menos 70 %. Toma otra foto más cerca del daño y con buena luz.',
    );
  });
});
