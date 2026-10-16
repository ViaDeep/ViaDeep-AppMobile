import type { Detection } from '@/inference/inference-engine';
import { buildIncidentRequest, manualReason, submitReport, type ReportDraft } from '@/services/report-service';

const detection: Detection = { type: 'D40', confidence: 0.82, bboxX: 0.1, bboxY: 0.2, bboxWidth: 0.3, bboxHeight: 0.4 };

function draft(overrides: Partial<ReportDraft> = {}): ReportDraft {
  return {
    photoUri: 'file:///foto.jpg',
    coordinates: { latitude: -12.0464, longitude: -77.0428 },
    detection: null,
    manualType: null,
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

  it('usa el tipo manual cuando la detección no alcanza el umbral', () => {
    const request = buildIncidentRequest(
      draft({ detection: { ...detection, confidence: 0.3 }, manualType: 'D00' }),
      'ev-1',
      0.5,
    );

    expect(request.type).toBe('D00');
    expect(request.aiValidated).toBe(false);
    expect(request.aiResult).toBeUndefined();
  });

  it('exige el tipo manual cuando no hay detección', () => {
    expect(() => buildIncidentRequest(draft(), 'ev-1', 0.5)).toThrow('Elige el tipo de daño');
  });

  it('envía la descripción sin espacios y la omite si está vacía', () => {
    expect(buildIncidentRequest(draft({ manualType: 'D10', description: '  frente al paradero ' }), 'ev', 0.5).description).toBe(
      'frente al paradero',
    );
    expect(buildIncidentRequest(draft({ manualType: 'D10', description: '   ' }), 'ev', 0.5)).not.toHaveProperty(
      'description',
    );
  });
});

describe('submitReport', () => {
  it('sube la foto y luego registra la incidencia con el id de la evidencia', async () => {
    const uploadEvidence = jest.fn().mockResolvedValue('ev-42');
    const registerIncident = jest.fn().mockResolvedValue({ id: 'inc-7' });

    const id = await submitReport(draft({ manualType: 'D20' }), {
      uploadEvidence,
      registerIncident,
      confidenceThreshold: 0.5,
    });

    expect(id).toBe('inc-7');
    expect(uploadEvidence).toHaveBeenCalledWith('file:///foto.jpg');
    expect(registerIncident).toHaveBeenCalledWith(expect.objectContaining({ evidenceId: 'ev-42', type: 'D20' }));
  });

  it('no sube la foto si falta el tipo de daño', async () => {
    const uploadEvidence = jest.fn();

    await expect(
      submitReport(draft(), { uploadEvidence, registerIncident: jest.fn(), confidenceThreshold: 0.5 }),
    ).rejects.toThrow();
    expect(uploadEvidence).not.toHaveBeenCalled();
  });
});

describe('manualReason', () => {
  const low: Detection = { type: 'D40', confidence: 0.347, bboxX: 0, bboxY: 0, bboxWidth: 1, bboxHeight: 1 };

  it('avisa si el celular no tiene el modelo', () => {
    expect(manualReason(false, null, 0.5)).toBe('Este celular no tiene el modelo de IA instalado, así que elige tú el tipo de daño.');
  });

  it('avisa si la IA no encontró ningún daño', () => {
    expect(manualReason(true, null, 0.5)).toBe(
      'La IA no reconoció ningún daño en la foto con al menos 50 % de seguridad. Elige tú el tipo de daño.',
    );
  });

  it('muestra la seguridad obtenida y la necesaria cuando no llega al umbral', () => {
    expect(manualReason(true, low, 0.5)).toBe('La IA solo tuvo 35 % de seguridad y se necesita al menos 50 %. Elige tú el tipo de daño.');
  });
});
