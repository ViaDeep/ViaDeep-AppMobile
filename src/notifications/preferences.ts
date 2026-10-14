import type { AppNotification, NotificationKind } from './build-notifications';

/** Qué tipos de aviso quiere ver el ciudadano. Se guarda en el celular. */
export type NotificationPreferences = Record<NotificationKind, boolean>;

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  REGISTERED: true,
  UPDATED: true,
  RESOLVED: true,
  REJECTED: true,
};

/** Lee lo guardado; cualquier valor ausente o inválido vuelve al valor por defecto (activado). */
export function parsePreferences(raw: string | null): NotificationPreferences {
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const stored = JSON.parse(raw) as Partial<Record<NotificationKind, unknown>>;
    const result = { ...DEFAULT_PREFERENCES };
    for (const kind of Object.keys(DEFAULT_PREFERENCES) as NotificationKind[]) {
      if (typeof stored[kind] === 'boolean') result[kind] = stored[kind] as boolean;
    }
    return result;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function applyPreferences(items: AppNotification[], preferences: NotificationPreferences): AppNotification[] {
  return items.filter((item) => preferences[item.kind]);
}
