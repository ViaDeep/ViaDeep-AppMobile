import type { DeviceSnapshot } from '../../modules/image-tensor/device-stats';

import { summarize, type LatencySummary } from './latency-stats';

/** Una detección de la prueba: [ms desde el inicio, total ms, inferencia ms]; total -1 = falló. */
export type RunSample = [number, number, number];

/** Una lectura del celular, con los ms desde el inicio de la prueba. */
export type DeviceSample = DeviceSnapshot & { t: number };

/** Registro de la prueba de uso continuo. Se guarda en el celular cada minuto para saber si la app se cerró. */
export type ContinuousLog = {
  version: 1;
  status: 'running' | 'done' | 'stopped';
  device: string;
  android: string;
  image: string;
  preprocessing: 'nativo' | 'js';
  plannedMinutes: number;
  startedAt: string;
  updatedAt: string;
  /** Veces que la app pasó a segundo plano durante la prueba (el sistema la frena allí). */
  backgroundCount: number;
  runs: RunSample[];
  samples: DeviceSample[];
  errors: string[];
};

export type MinuteSummary = {
  minute: number;
  runs: number;
  failed: number;
  meanTotalMs: number | null;
  p95TotalMs: number | null;
  meanInferenceMs: number | null;
  pssMb: number | null;
  batteryTempC: number | null;
  thermalStatus: number | null;
};

export type ContinuousSummary = {
  elapsedMinutes: number;
  runs: number;
  failed: number;
  totalMs: LatencySummary | null;
  inferenceMs: LatencySummary | null;
  /** Latencia media del primer y del último minuto completo, y cuánto cambió (%). */
  firstMinuteMeanMs: number | null;
  lastMinuteMeanMs: number | null;
  latencyChangePercent: number | null;
  pssStartMb: number | null;
  pssMaxMb: number | null;
  pssEndMb: number | null;
  batteryTempStartC: number | null;
  batteryTempMaxC: number | null;
  batteryTempEndC: number | null;
  thermalStatusMax: number | null;
  batteryStartPercent: number | null;
  batteryEndPercent: number | null;
};

const MINUTE = 60_000;

const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const mean = (values: number[]) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null);
const maxOf = (values: (number | null)[]) => {
  const present = values.filter((v): v is number => v != null);
  return present.length ? Math.max(...present) : null;
};

/** Tiempo de la prueba: hasta la última detección o lectura registrada. */
export function elapsedMs(log: Pick<ContinuousLog, 'runs' | 'samples'>): number {
  const lastRun = log.runs.length ? log.runs[log.runs.length - 1][0] : 0;
  const lastSample = log.samples.length ? log.samples[log.samples.length - 1].t : 0;
  return Math.max(lastRun, lastSample);
}

/** Resumen minuto a minuto: latencia de las detecciones de ese minuto y la última lectura del celular en él. */
export function minuteSummaries(log: Pick<ContinuousLog, 'runs' | 'samples'>): MinuteSummary[] {
  const minutes = Math.ceil(elapsedMs(log) / MINUTE);
  const result: MinuteSummary[] = [];
  for (let m = 0; m < minutes; m++) {
    const inMinute = (t: number) => t >= m * MINUTE && t < (m + 1) * MINUTE;
    const runs = log.runs.filter(([t]) => inMinute(t));
    const ok = runs.filter(([, total]) => total >= 0);
    const totals = ok.map(([, total]) => total);
    const samples = log.samples.filter((s) => inMinute(s.t));
    const sample = samples.length ? samples[samples.length - 1] : null;
    result.push({
      minute: m + 1,
      runs: runs.length,
      failed: runs.length - ok.length,
      meanTotalMs: totals.length ? round(mean(totals)!) : null,
      p95TotalMs: totals.length ? round(summarize(totals).p95) : null,
      meanInferenceMs: ok.length ? round(mean(ok.map(([, , inference]) => inference))!) : null,
      pssMb: sample ? round(sample.pssMb) : null,
      batteryTempC: sample?.batteryTempC ?? null,
      thermalStatus: sample?.thermalStatus ?? null,
    });
  }
  return result;
}

export function summarizeContinuous(log: Pick<ContinuousLog, 'runs' | 'samples'>): ContinuousSummary {
  const ok = log.runs.filter(([, total]) => total >= 0);
  // Solo minutos completos con detecciones, para que un último minuto cortado no distorsione la comparación.
  const elapsed = elapsedMs(log);
  const full = minuteSummaries(log).filter((m) => m.minute * MINUTE <= elapsed && m.meanTotalMs != null);
  const first = full.length ? full[0].meanTotalMs : null;
  const last = full.length > 1 ? full[full.length - 1].meanTotalMs : null;
  const firstSample = log.samples[0];
  const lastSample = log.samples[log.samples.length - 1];
  return {
    elapsedMinutes: round(elapsed / MINUTE, 2),
    runs: log.runs.length,
    failed: log.runs.length - ok.length,
    totalMs: ok.length ? summarize(ok.map(([, total]) => total)) : null,
    inferenceMs: ok.length ? summarize(ok.map(([, , inference]) => inference)) : null,
    firstMinuteMeanMs: first,
    lastMinuteMeanMs: last,
    latencyChangePercent: first != null && last != null ? round(((last - first) / first) * 100) : null,
    pssStartMb: firstSample ? round(firstSample.pssMb) : null,
    pssMaxMb: maxOf(log.samples.map((s) => round(s.pssMb))),
    pssEndMb: lastSample ? round(lastSample.pssMb) : null,
    batteryTempStartC: firstSample?.batteryTempC ?? null,
    batteryTempMaxC: maxOf(log.samples.map((s) => s.batteryTempC)),
    batteryTempEndC: lastSample?.batteryTempC ?? null,
    thermalStatusMax: maxOf(log.samples.map((s) => s.thermalStatus)),
    batteryStartPercent: firstSample?.batteryPercent ?? null,
    batteryEndPercent: lastSample?.batteryPercent ?? null,
  };
}
