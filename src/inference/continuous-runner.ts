import type { DeviceSnapshot } from '../../modules/image-tensor/device-stats';

import type { ContinuousLog } from './continuous-test';
import type { StageTimes } from './onnx-engine';

const SAMPLE_EVERY_MS = 30_000;
const SAVE_EVERY_MS = 60_000;
const PROGRESS_EVERY_MS = 2_000;
const MAX_ERRORS = 20;

export type ContinuousProgress = {
  elapsedMs: number;
  runs: number;
  failed: number;
  lastTotalMs: number | null;
  pssMb: number | null;
  batteryTempC: number | null;
};

type Options = {
  log: ContinuousLog;
  detect: () => Promise<{ times: StageTimes }>;
  snapshot: () => Promise<DeviceSnapshot>;
  save: (log: ContinuousLog) => Promise<void>;
  shouldStop: () => boolean;
  backgroundCount: () => number;
  onProgress: (progress: ContinuousProgress) => void;
};

export const formatClock = (millis: number) => {
  const seconds = Math.floor(millis / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Detecta una foto tras otra hasta cumplir `log.plannedMinutes` o hasta que se pida detener. Cada 30 s lee el
 * estado del celular y cada minuto guarda el registro, para que un cierre de la app deje rastro.
 */
export async function runContinuousTest({ log, detect, snapshot, save, shouldStop, backgroundCount, onProgress }: Options) {
  const start = performance.now();
  const plannedMs = log.plannedMinutes * 60_000;
  const touch = () => {
    log.updatedAt = new Date().toISOString();
    log.backgroundCount = backgroundCount();
  };
  let nextSample = 0;
  let nextSave = SAVE_EVERY_MS;
  let nextProgress = 0;
  let lastTotal: number | null = null;
  let failed = 0;
  await save(log);
  while (!shouldStop()) {
    const t = performance.now() - start;
    if (t >= plannedMs) break;
    if (t >= nextSample) {
      log.samples.push({ t: Math.round(t), ...(await snapshot()) });
      nextSample += SAMPLE_EVERY_MS;
    }
    try {
      const { times } = await detect();
      lastTotal = times.total;
      log.runs.push([Math.round(t), Number(times.total.toFixed(1)), Number(times.inference.toFixed(1))]);
    } catch (e) {
      failed++;
      log.runs.push([Math.round(t), -1, -1]);
      if (log.errors.length < MAX_ERRORS) log.errors.push(`${formatClock(t)} ${e instanceof Error ? e.message : String(e)}`);
    }
    const after = performance.now() - start;
    if (after >= nextSave) {
      touch();
      await save(log);
      nextSave += SAVE_EVERY_MS;
    }
    if (after >= nextProgress) {
      const last = log.samples[log.samples.length - 1];
      onProgress({ elapsedMs: after, runs: log.runs.length, failed, lastTotalMs: lastTotal, pssMb: last?.pssMb ?? null, batteryTempC: last?.batteryTempC ?? null });
      nextProgress = after + PROGRESS_EVERY_MS;
    }
  }
  // Lectura final, para comparar el estado del celular al terminar con el del inicio.
  log.samples.push({ t: Math.round(performance.now() - start), ...(await snapshot()) });
  log.status = shouldStop() ? 'stopped' : 'done';
  touch();
  await save(log);
  return log;
}
