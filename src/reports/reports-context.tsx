import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { incidentApi } from '@/api/incident-api';
import type { IncidentDetail } from '@/domain/incident';
import { buildNotifications, type AppNotification, type NotificationKind } from '@/notifications/build-notifications';
import { applyPreferences, DEFAULT_PREFERENCES, parsePreferences, type NotificationPreferences } from '@/notifications/preferences';

const SEEN_KEY = 'viadeep.notificationsSeenAt';
const PREFERENCES_KEY = 'viadeep.notificationPreferences';
/** Evita repetir la consulta cuando el usuario cambia de pestaña muy seguido. */
const MIN_REFRESH_MS = 5000;

type ReportsState = {
  reports: IncidentDetail[];
  totalReports: number;
  loading: boolean;
  error: string | null;
  notifications: AppNotification[];
  unreadCount: number;
  refresh: (force?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  preferences: NotificationPreferences;
  setPreference: (kind: NotificationKind, enabled: boolean) => void;
};

const ReportsContext = createContext<ReportsState | null>(null);

/** Reportes del ciudadano y avisos derivados de ellos, compartidos por todas las pestañas. */
export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<IncidentDetail[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const lastLoad = useRef(0);

  useEffect(() => {
    SecureStore.getItemAsync(SEEN_KEY)
      .then(setSeenAt)
      .catch(() => undefined);
    SecureStore.getItemAsync(PREFERENCES_KEY)
      .then((raw) => setPreferences(parsePreferences(raw)))
      .catch(() => undefined);
  }, []);

  const refresh = useCallback(async (force = false) => {
    if (!force && Date.now() - lastLoad.current < MIN_REFRESH_MS) return;
    lastLoad.current = Date.now();
    setLoading(true);
    try {
      const page = await incidentApi.mine(0, 50);
      // El listado no trae la foto ni el historial, así que se pide el detalle de cada reporte.
      const details = await Promise.all(page.items.map((item) => incidentApi.detail(item.id)));
      setReports(details);
      setTotalReports(page.totalItems);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus reportes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    await SecureStore.setItemAsync(SEEN_KEY, now).catch(() => undefined);
  }, []);

  const setPreference = useCallback((kind: NotificationKind, enabled: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [kind]: enabled };
      SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const notifications = useMemo(
    () => applyPreferences(buildNotifications(reports, seenAt), preferences),
    [reports, seenAt, preferences],
  );
  const unreadCount = notifications.filter((item) => item.unread).length;

  const value = useMemo(
    () => ({
      reports,
      totalReports,
      loading,
      error,
      notifications,
      unreadCount,
      refresh,
      markAllRead,
      preferences,
      setPreference,
    }),
    [reports, totalReports, loading, error, notifications, unreadCount, refresh, markAllRead, preferences, setPreference],
  );
  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports(): ReportsState {
  const value = useContext(ReportsContext);
  if (!value) {
    throw new Error('useReports debe usarse dentro de ReportsProvider');
  }
  return value;
}
