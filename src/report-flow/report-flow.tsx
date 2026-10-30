import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { IncidentType } from '@/domain/incident';
import type { Detection } from '@/inference/inference-engine';
import type { Coordinates } from '@/services/report-service';

/** Foto tomada en la cámara, con la ubicación y la dirección obtenidas en ese momento. */
export type Capture = {
  photoUri: string;
  coordinates: Coordinates;
  accuracy: number | null;
  address: string | null;
  capturedAt: string;
};

/** Datos que se van llenando a lo largo de los 4 pasos del reporte. */
export type ReportFlowState = {
  capture: Capture | null;
  detection: Detection | null;
  manualType: IncidentType | null;
  /** Comentario opcional del ciudadano sobre la incidencia. */
  description: string;
  /** Resultado del envío, para la pantalla de confirmación. */
  submitted: { id: string; createdAt: string } | null;
};

const EMPTY: ReportFlowState = { capture: null, detection: null, manualType: null, description: '', submitted: null };

type ReportFlow = ReportFlowState & {
  update: (changes: Partial<ReportFlowState>) => void;
  reset: () => void;
};

const ReportFlowContext = createContext<ReportFlow | null>(null);

export function ReportFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReportFlowState>(EMPTY);
  const value = useMemo(
    () => ({
      ...state,
      update: (changes: Partial<ReportFlowState>) => setState((current) => ({ ...current, ...changes })),
      reset: () => setState(EMPTY),
    }),
    [state],
  );
  return <ReportFlowContext.Provider value={value}>{children}</ReportFlowContext.Provider>;
}

export function useReportFlow(): ReportFlow {
  const value = useContext(ReportFlowContext);
  if (!value) {
    throw new Error('useReportFlow debe usarse dentro de ReportFlowProvider');
  }
  return value;
}
