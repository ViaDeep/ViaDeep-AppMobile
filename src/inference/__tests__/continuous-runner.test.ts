import { runContinuousTest } from '../continuous-runner';
import type { ContinuousLog } from '../continuous-test';

const snapshot = {
  pssMb: 300,
  javaHeapMb: 10,
  nativeHeapMb: 50,
  batteryTempC: 30,
  batteryPercent: 90,
  charging: false,
  thermalStatus: 0,
  thermalHeadroom: null,
};

const newLog = (plannedMinutes: number): ContinuousLog => ({
  version: 1,
  status: 'running',
  device: 'test',
  android: '15',
  image: 'x.jpg',
  preprocessing: 'nativo',
  plannedMinutes,
  startedAt: '',
  updatedAt: '',
  backgroundCount: 0,
  runs: [],
  samples: [],
  errors: [],
});

const times = { pixels: 100, tensor: 0, inference: 90, postprocess: 1, total: 200 };

describe('continuous-runner', () => {
  let clock = 0;
  beforeEach(() => {
    clock = 0;
    // Cada detección "tarda" 1 s.
    jest.spyOn(performance, 'now').mockImplementation(() => clock);
  });
  afterEach(() => jest.restoreAllMocks());

  it('detecta hasta cumplir el tiempo, lee el celular cada 30 s y guarda cada minuto', async () => {
    const saves: string[] = [];
    let calls = 0;
    const log = await runContinuousTest({
      log: newLog(2),
      detect: async () => {
        clock += 1000;
        calls++;
        if (calls === 5) throw new Error('falla de prueba');
        return { times };
      },
      snapshot: async () => snapshot,
      save: async (l) => void saves.push(l.status),
      shouldStop: () => false,
      backgroundCount: () => 1,
      onProgress: () => undefined,
    });
    expect(log.status).toBe('done');
    expect(log.runs).toHaveLength(120);
    expect(log.runs[4]).toEqual([4000, -1, -1]);
    expect(log.errors).toEqual(['0:04 falla de prueba']);
    // Lecturas en 0, 30, 60 y 90 s más la final.
    expect(log.samples.map((s) => s.t)).toEqual([0, 30_000, 60_000, 90_000, 120_000]);
    // Al inicio, a los 60 s, a los 120 s y al terminar.
    expect(saves).toEqual(['running', 'running', 'running', 'done']);
    expect(log.backgroundCount).toBe(1);
  });

  it('se detiene cuando se pide', async () => {
    let calls = 0;
    const log = await runContinuousTest({
      log: newLog(30),
      detect: async () => {
        clock += 1000;
        calls++;
        return { times };
      },
      snapshot: async () => snapshot,
      save: async () => undefined,
      shouldStop: () => calls >= 10,
      backgroundCount: () => 0,
      onProgress: () => undefined,
    });
    expect(log.status).toBe('stopped');
    expect(log.runs).toHaveLength(10);
  });
});
