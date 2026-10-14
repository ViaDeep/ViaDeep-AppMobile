import type { IncidentStatus, Severity } from './incident';

/**
 * Estado tal como lo ve el ciudadano. El backend no tiene un estado "en revisión": se considera así a un
 * reporte pendiente al que la municipalidad ya le asignó severidad.
 */
export type CitizenStatus = 'REGISTERED' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export const CITIZEN_STATUS_LABELS: Record<CitizenStatus, string> = {
  REGISTERED: 'Registrada',
  IN_REVIEW: 'En revisión',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  REJECTED: 'Rechazado',
};

export function citizenStatus(status: IncidentStatus, severity: Severity | null): CitizenStatus {
  switch (status) {
    case 'PENDING':
      return severity ? 'IN_REVIEW' : 'REGISTERED';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'RESOLVED':
      return 'RESOLVED';
    case 'REJECTED':
      return 'REJECTED';
  }
}

/** Fase del seguimiento (1 a 4) que muestra el detalle del reporte. */
export function statusPhase(status: CitizenStatus): number {
  switch (status) {
    case 'REGISTERED':
      return 1;
    case 'IN_REVIEW':
    case 'REJECTED':
      return 2;
    case 'IN_PROGRESS':
      return 3;
    case 'RESOLVED':
      return 4;
  }
}

/**
 * Código legible del reporte (por ejemplo REP-2026-LM-04821). El backend identifica las incidencias con un
 * UUID, así que el número se deriva de él: es estable pero no correlativo.
 */
export function reportCode(id: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const hex = id.replace(/-/g, '').slice(0, 8);
  const value = Number.parseInt(hex, 16);
  const number = Number.isNaN(value) ? 0 : value % 100000;
  return `REP-${year}-LM-${String(number).padStart(5, '0')}`;
}

/** "Hace 5 min", "Hace 2 horas", "Ayer" o la fecha corta. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (date.toDateString() === now.toDateString()) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]}`;
}

/** 27/09/2026 · 09:40 AM */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${day} · ${pad(hours12)}:${pad(date.getMinutes())} ${hours24 < 12 ? 'AM' : 'PM'}`;
}

/** 10:14 hrs */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())} hrs`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '').slice(0, 2);
  return letters.toUpperCase();
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** "Hoy · 10:14 hrs", "Ayer · 16:45 hrs" o "27/09/2026 · 16:45 hrs". */
export function dayAndClock(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day =
    date.toDateString() === now.toDateString()
      ? 'Hoy'
      : date.toDateString() === yesterday.toDateString()
        ? 'Ayer'
        : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${day} · ${formatClock(iso)}`;
}

/** "14 Octubre 2026, 10:15 am" */
export function longDate(iso: string): string {
  const date = new Date(iso);
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours12}:${pad(date.getMinutes())} ${hours24 < 12 ? 'am' : 'pm'}`;
}
