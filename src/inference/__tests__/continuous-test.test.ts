import { minuteSummaries, summarizeContinuous, type DeviceSample, type RunSample } from '../continuous-test';

const sample = (t: number, pssMb: number, batteryTempC: number, thermalStatus = 0): DeviceSample => ({
  t,
  pssMb,
  javaHeapMb: 10,
  nativeHeapMb: 50,
  batteryTempC,
  batteryPercent: 90 - t / 60_000,
  charging: false,
  thermalStatus,
  thermalHeadroom: null,
});

describe('continuous-test', () => {
  // 3 minutos: el primero a 200 ms por foto, el segundo a 220 ms con una falla, el tercero a 240 ms.
  const runs: RunSample[] = [
    [10_000, 200, 90],
    [40_000, 200, 90],
    [70_000, 220, 100],
    [80_000, -1, -1],
    [100_000, 220, 100],
    [130_000, 240, 110],
    [170_000, 240, 110],
  ];
  const samples = [sample(0, 300, 30), sample(60_000, 310, 31), sample(120_000, 305, 33, 1), sample(180_000, 308, 34, 1)];

  it('agrupa las detecciones y lecturas por minuto', () => {
    const minutes = minuteSummaries({ runs, samples });
    expect(minutes.map((m) => [m.minute, m.runs, m.failed, m.meanTotalMs])).toEqual([
      [1, 2, 0, 200],
      [2, 3, 1, 220],
      [3, 2, 0, 240],
    ]);
    expect(minutes[1]).toMatchObject({ pssMb: 310, batteryTempC: 31, meanInferenceMs: 100 });
  });

  it('resume la prueba y compara el primer y el último minuto', () => {
    const summary = summarizeContinuous({ runs, samples });
    expect(summary).toMatchObject({
      elapsedMinutes: 3,
      runs: 7,
      failed: 1,
      firstMinuteMeanMs: 200,
      lastMinuteMeanMs: 240,
      latencyChangePercent: 20,
      pssStartMb: 300,
      pssMaxMb: 310,
      pssEndMb: 308,
      batteryTempStartC: 30,
      batteryTempMaxC: 34,
      thermalStatusMax: 1,
    });
    expect(summary.totalMs?.mean).toBeCloseTo(220);
  });

  it('no compara minutos si la prueba no llegó a uno completo', () => {
    const summary = summarizeContinuous({ runs: [[5_000, 200, 90]], samples: [sample(0, 300, 30)] });
    expect(summary.firstMinuteMeanMs).toBeNull();
    expect(summary.latencyChangePercent).toBeNull();
  });
});
