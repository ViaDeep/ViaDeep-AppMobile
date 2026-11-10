import type { Detection } from '@/inference/inference-engine';
import { buildIncidentRequest, noDetectionReason, submitReport, type ReportDraft } from '@/services/report-service';

const detection: Detection = { type: 'D40', confidence: 0.82, bboxX: 0.1, bboxY: 0.2, bboxWidth: 0.3, bboxHeight: 0.4 };

function draft(overrides: Partial<ReportDraft> = {}): ReportDraft {
  return {
    photoUri: 'file:///foto.jpg',
    coordinates: { latitude: -12.0464, longitude: -77.0428 },
    detection: null,
    description: '',
    ...overrides,
  };
}

describe('buildIncidentRequest', () => {
  it('marca el reporte como validado por IA cuando la confianza supera el umbral', () => {
    const request = buildIncidentRequest(draft({ detection }), 'ev-1', 0.5);

    expect(request).toEqual({
      evidenceId: 'ev-1',
      type: 'D40',
      latitude: -12.0464,
      longitude: -77.0428,
      aiValidated: true,
      aiResult: { confidence: 0.82, bboxX: 0.1, bboxY: 0.2, bboxWidth: 0.3, bboxHeight: 0.4 },
    });
  });

  it('no arma el reporte si la detección no alcanza el umbral', () => {
    expect(() => buildIncidentRequest(draft({ detection: { ...detection, confidence: 0.3 } }), 'ev-1', 0.5)).toThrow(
      'Toma otra foto',
    );
  });

  it('no arma el reporte si no hay detección', () => {
    expect(() => buildIncidentRequest(draft(), 'ev-1', 0.5)).toThrow('La IA no reconoció ningún daño');
  });

  it('envía la descripción sin espacios y la omite si está vacía', () => {
    expect(buildIncidentRequest(draft({ detection, description: '  frente al paradero ' }), 'ev', 0.5).description).toBe(
      'frente al paradero',
    );
    expect(buildIncidentRequest(draft({ detection, description: '   ' }), 'ev', 0.5)).not.toHaveProperty(
      'description',
    );
  });
});

describe('submitReport', () => {
  it('sube la foto y luego registra la incidencia con el id de la evidencia', async () => {
    const uploadEvidence = jest.fn().mockResolvedValue('ev-42');
    const registerIncident = jest.fn().mockResolvedValue({ id: 'inc-7' });

    const id = await submitReport(draft({ detection }), {
      uploadEvidence,
      registerIncident,
      confidenceThreshold: 0.5,
    });

    expect(id).toBe('inc-7');
    expect(uploadEvidence).toHaveBeenCalledWith('file:///foto.jpg');
    expect(registerIncident).toHaveBeenCalledWith(expect.objectContaining({ evidenceId: 'ev-42', type: 'D40', aiValidated: true }));
  });

  it('no sube la foto si la IA no detectó un daño', async () => {
    const uploadEvidence = jest.fn();

    await expect(
      submitReport(draft(), { uploadEvidence, registerIncident: jest.fn(), confidenceThreshold: 0.5 }),
    ).rejects.toThrow();
    expect(uploadEvidence).not.toHaveBeenCalled();
  });
});

describe('noDetectionReason', () => {
  const low: Detection = { type: 'D40', confidence: 0.347, bboxX: 0, bboxY: 0, bboxWidth: 1, bboxHeight: 1 };

  it('avisa si el celular no tiene el modelo', () => {
    expect(noDetectionReason(false, null, 0.5)).toBe(
      'Esta versión de la app no tiene el modelo de IA instalado. Instala la versión más reciente para reportar.',
    );
  });

  it('avisa si la IA no encontró ningún daño', () => {
    expect(noDetectionReason(true, null, 0.5)).toBe(
      'La IA no reconoció ningún daño en la foto con al menos 50 % de seguridad. Toma otra foto más cerca del daño y con buena luz.',
    );
  });

  it('muestra la seguridad obtenida y la necesaria cuando no llega al umbral', () => {
    expect(noDetectionReason(true, low, 0.5)).toBe(
      'La IA solo tuvo 35 % de seguridad y se necesita al menos 50 %. Toma otra foto más cerca del daño y con buena luz.',
    );
  });
});
