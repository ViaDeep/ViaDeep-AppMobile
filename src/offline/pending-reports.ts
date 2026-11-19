import type { Detection } from '@/inference/inference-engine';
import type { Coordinates, ReportDraft } from '@/services/report-service';

/** Reporte que no se pudo enviar por falta de conexión y espera en el celular. */
export type PendingReport = {
  /** Id local; el backend asigna el definitivo al enviarlo. */
  localId: string;
  /** Ciudadano que lo registró: en un celular compartido cada cuenta ve y envía solo los suyos. */
  ownerId: string;
  photoUri: string;
  coordinates: Coordinates;
  address: string | null;
  capturedAt: string;
  detections: Detection[];
  description: string;
  savedAt: string;
};

/** Las versiones anteriores de la app guardaban solo la detección principal en `detection`. */
type StoredPendingReport = Omit<PendingReport, 'detections'> & { detections?: Detection[]; detection?: Detection | null };

function upgrade(item: StoredPendingReport): PendingReport {
  const { detection, detections, ...rest } = item;
  return { ...rest, detections: detections ?? (detection ? [detection] : []) };
}

/** Dónde se guarda la lista (un archivo en el celular; en las pruebas, memoria). */
export type PendingStorage = {
  read: () => Promise<string | null>;
  write: (contents: string) => Promise<void>;
};

export function toDraft(report: PendingReport): ReportDraft {
  return {
    photoUri: report.photoUri,
    coordinates: report.coordinates,
    detections: report.detections,
    description: report.description,
  };
}

/** Lee la lista guardada; si el archivo no existe o está dañado, no hay pendientes. */
export function parsePending(raw: string | null): PendingReport[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? (value as StoredPendingReport[]).filter((item) => typeof item?.localId === 'string').map(upgrade)
      : [];
  } catch {
    return [];
  }
}

export async function loadPending(storage: PendingStorage): Promise<PendingReport[]> {
  return parsePending(await storage.read());
}

/** Agrega un reporte al final de la cola (el más antiguo se envía primero). */
export async function addPending(storage: PendingStorage, report: PendingReport): Promise<PendingReport[]> {
  const next = [...(await loadPending(storage)).filter((item) => item.localId !== report.localId), report];
  await storage.write(JSON.stringify(next));
  return next;
}

export async function removePending(storage: PendingStorage, localId: string): Promise<PendingReport[]> {
  const next = (await loadPending(storage)).filter((item) => item.localId !== localId);
  await storage.write(JSON.stringify(next));
  return next;
}
