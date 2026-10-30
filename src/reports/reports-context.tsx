import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { incidentApi } from '@/api/incident-api';
import { notificationApi, type ApiNotification } from '@/api/notification-api';
import type { IncidentDetail } from '@/domain/incident';
import {
  buildNotifications,
  mergeNotifications,
  type AppNotification,
  type NotificationKind,
} from '@/notifications/build-notifications';
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
  markRead: (item: AppNotification) => void;
  markAllRead: () => Promise<void>;
  preferences: NotificationPreferences;
  setPreference: (kind: NotificationKind, enabled: boolean) => void;
};

const ReportsContext = createContext<ReportsState | null>(null);

/** Reportes del ciudadano y sus avisos, compartidos por todas las pestañas. */
export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<IncidentDetail[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  /** null si el servicio de notificaciones no respondió: entonces los avisos se arman en el celular. */
  const [serverNotifications, setServerNotifications] = useState<ApiNotification[] | null>(null);
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
    const notificationsRequest = notificationApi
      .list(0, 100)
      .then((page) => setServerNotifications(page.items))
      .catch(() => setServerNotifications(null));
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
      await notificationsRequest;
      setLoading(false);
    }
  }, []);

  const markRead = useCallback((item: AppNotification) => {
    const serverId = item.serverId;
    if (!serverId || !item.unread) return;
    setServerNotifications((current) =>
      current ? current.map((entry) => (entry.id === serverId ? { ...entry, read: true } : entry)) : current,
    );
    notificationApi.markRead(serverId).catch(() => undefined);
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    setServerNotifications((current) => (current ? current.map((entry) => ({ ...entry, read: true })) : current));
    await Promise.all([
      SecureStore.setItemAsync(SEEN_KEY, now).catch(() => undefined),
      notificationApi.markAllRead().catch(() => undefined),
    ]);
  }, []);

  const setPreference = useCallback((kind: NotificationKind, enabled: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [kind]: enabled };
      SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const notifications = useMemo(
    () =>
      applyPreferences(
        serverNotifications
          ? mergeNotifications(reports, serverNotifications, seenAt)
          : buildNotifications(reports, seenAt),
        preferences,
      ),
    [reports, serverNotifications, seenAt, preferences],
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
      markRead,
      markAllRead,
      preferences,
      setPreference,
    }),
    [reports, totalReports, loading, error, notifications, unreadCount, refresh, markRead, markAllRead, preferences, setPreference],
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
