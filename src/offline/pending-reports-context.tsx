import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { evidenceApi } from '@/api/evidence-api';
import { incidentApi } from '@/api/incident-api';
import { env } from '@/config/env';
import { submitReport } from '@/services/report-service';
import { useSession } from '@/session/session-context';

import { addPending, loadPending, removePending, toDraft, type PendingReport } from './pending-reports';
import { deletePhoto, fileStorage, keepPhoto } from './pending-storage';

type NewPending = Omit<PendingReport, 'localId' | 'ownerId' | 'savedAt'>;

type PendingReportsState = {
  pending: PendingReport[];
  /** Guarda el reporte en el celular (con una copia de la foto) para enviarlo después. */
  save: (report: NewPending) => Promise<void>;
  /** Intenta enviarlo ahora; si lo logra lo quita de la cola y devuelve el id del backend. */
  send: (localId: string) => Promise<string>;
  discard: (localId: string) => Promise<void>;
};

const PendingReportsContext = createContext<PendingReportsState | null>(null);

function newLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PendingReportsProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const ownerId = user?.id ?? '';
  const [all, setAll] = useState<PendingReport[]>([]);
  const pending = useMemo(() => all.filter((item) => item.ownerId === ownerId), [all, ownerId]);

  useEffect(() => {
    loadPending(fileStorage)
      .then(setAll)
      .catch(() => undefined);
  }, []);

  const save = useCallback(
    async (report: NewPending) => {
      const localId = newLocalId();
      const photoUri = await keepPhoto(report.photoUri, localId);
      setAll(await addPending(fileStorage, { ...report, photoUri, localId, ownerId, savedAt: new Date().toISOString() }));
    },
    [ownerId],
  );

  const discard = useCallback(async (localId: string) => {
    const report = (await loadPending(fileStorage)).find((item) => item.localId === localId);
    setAll(await removePending(fileStorage, localId));
    if (report) await deletePhoto(report.photoUri);
  }, []);

  const send = useCallback(
    async (localId: string) => {
      const report = (await loadPending(fileStorage)).find((item) => item.localId === localId && item.ownerId === ownerId);
      if (!report) throw new Error('Este reporte ya no está pendiente.');
      const id = await submitReport(toDraft(report), {
        uploadEvidence: evidenceApi.upload,
        registerIncident: incidentApi.register,
        confidenceThreshold: env.aiConfidenceThreshold,
      });
      await discard(localId);
      return id;
    },
    [discard, ownerId],
  );

  const value = useMemo(() => ({ pending, save, send, discard }), [pending, save, send, discard]);
  return <PendingReportsContext.Provider value={value}>{children}</PendingReportsContext.Provider>;
}

export function usePendingReports(): PendingReportsState {
  const value = useContext(PendingReportsContext);
  if (!value) {
    throw new Error('usePendingReports debe usarse dentro de PendingReportsProvider');
  }
  return value;
}
