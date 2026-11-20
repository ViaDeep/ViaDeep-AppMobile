export type IncidentType = 'D00' | 'D10' | 'D20' | 'D40';
export type IncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

/** Clases de RDD2022 que detecta LMD-YOLO, en el orden de salida del modelo. */
export const INCIDENT_TYPES: readonly IncidentType[] = ['D00', 'D10', 'D20', 'D40'];

export const TYPE_LABELS: Record<IncidentType, string> = {
  D00: 'Grieta longitudinal',
  D10: 'Grieta transversal',
  D20: 'Piel de cocodrilo',
  D40: 'Bache',
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En atención',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export type AiResult = {
  confidence: number;
  bboxX: number;
  bboxY: number;
  bboxWidth: number;
  bboxHeight: number;
};

/** Los tipos distintos de una lista de daños, en el orden en que aparecen ("Piel de cocodrilo, Bache"). */
export function typeListLabel(types: IncidentType[]): string {
  return [...new Set(types)].map((type) => TYPE_LABELS[type]).join(', ');
}

/** Un daño que LMD-YOLO reconoció en la foto; accepted indica si superó el umbral de confianza. */
export type DetectedDamage = AiResult & { type: IncidentType; accepted: boolean };

export type IncidentSummary = {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: Severity | null;
  latitude: number;
  longitude: number;
  district: string | null;
  aiValidated: boolean;
  createdAt: string;
};

export type HistoryEntry = {
  fromStatus: IncidentStatus | null;
  toStatus: IncidentStatus;
  changedBy: string;
  comment: string | null;
  changedAt: string;
};

export type IncidentDetail = IncidentSummary & {
  reporterId: string;
  evidenceId: string;
  description: string | null;
  aiResult: AiResult | null;
  /** Todas las detecciones de la foto (los reportes antiguos traen solo la principal; si el backend no lo envía, vacío). */
  detections?: DetectedDamage[];
  updatedAt: string;
  history: HistoryEntry[];
  possibleDuplicates: string[];
};

export type Page<T> = { items: T[]; page: number; size: number; totalItems: number };
