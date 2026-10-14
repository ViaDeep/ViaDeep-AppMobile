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
  updatedAt: string;
  history: HistoryEntry[];
  possibleDuplicates: string[];
};

export type Page<T> = { items: T[]; page: number; size: number; totalItems: number };
