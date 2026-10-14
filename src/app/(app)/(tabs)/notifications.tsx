import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { CITIZEN_STATUS_LABELS, dayAndClock, formatDateTime, relativeTime } from '@/domain/display';
import type { AppNotification, NotificationKind } from '@/notifications/build-notifications';
import { useReports } from '@/reports/reports-context';
import { Icon, type IconName } from '@/ui/icon';
import { StatusBadge } from '@/ui/status-badge';

type Look = { icon: IconName; color: string; background: string; border?: string; title: string };

const LOOKS: Record<NotificationKind, Look> = {
  REGISTERED: { icon: 'assignment', color: colors.primary, background: colors.surfaceBlue, title: 'Reporte registrado' },
  UPDATED: { icon: 'engineering', color: colors.primary, background: colors.surfaceBlueStrong, title: 'Reporte actualizado' },
  RESOLVED: { icon: 'task-alt', color: '#059669', background: '#ECFDF5', border: 'rgba(167,243,208,0.5)', title: 'Incidencia resuelta' },
  REJECTED: { icon: 'block', color: colors.danger, background: 'rgba(255,218,214,0.4)', border: 'rgba(186,26,26,0.2)', title: 'Reporte rechazado' },
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, refresh, markAllRead } = useReports();
  const [onlyUnread, setOnlyUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const visible = onlyUnread ? notifications.filter((item) => item.unread) : notifications;
  const today = new Date().toDateString();
  const recent = visible.filter((item) => new Date(item.at).toDateString() === today);
  const older = visible.filter((item) => new Date(item.at).toDateString() !== today);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Icon name="notifications-active" size={16} color={colors.white} />
            </View>
            <View style={styles.flexShrink}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Notificaciones</Text>
                {unreadCount > 0 ? (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>{unreadCount === 1 ? '1 nueva' : `${unreadCount} nuevas`}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.subtitle}>Centro telemático Lima Metropolitana</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Marcar todas como leídas"
            onPress={() => void markAllRead()}
            disabled={unreadCount === 0}
            style={[styles.readAll, unreadCount === 0 && styles.disabled]}>
            <Icon name="done-all" size={16} color={colors.primary} />
            <Text style={styles.readAllText}>Leídas</Text>
          </Pressable>
        </View>
        <View style={styles.chips}>
          <Pressable onPress={() => setOnlyUnread(false)} style={[styles.chip, !onlyUnread && styles.chipSelected]}>
            <Text style={[styles.chipText, !onlyUnread && styles.chipTextSelected]}>Todas ({notifications.length})</Text>
          </Pressable>
          <Pressable onPress={() => setOnlyUnread(true)} style={[styles.chip, onlyUnread && styles.chipSelected]}>
            <View style={styles.chipDot} />
            <Text style={[styles.chipText, onlyUnread && styles.chipTextSelected]}>No leídas ({unreadCount})</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}>
        {recent.length > 0 ? <Divider label="HOY · EN TIEMPO REAL" /> : null}
        {recent.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
        {older.length > 0 ? <Divider label="ANTERIORES" /> : null}
        {older.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
        {visible.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Icon name="notifications-off" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>{onlyUnread ? 'No tienes avisos sin leer.' : 'Aún no tienes avisos. Te avisaremos cuando cambie el estado de tus reportes.'}</Text>
          </View>
        ) : null}

        <Pressable onPress={() => router.push('/settings/notifications')} style={styles.preferences}>
          <View style={styles.inline}>
            <Icon name="settings" size={17} color={colors.textStrong} />
            <Text style={styles.preferencesText}>Gestionar alertas y preferencias de avisos</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <View style={styles.divider}>
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function NotificationCard({ item }: { item: AppNotification }) {
  const look = LOOKS[item.kind];
  const today = new Date(item.at).toDateString() === new Date().toDateString();
  const time = today ? `Hoy · ${relativeTime(item.at)}` : item.kind === 'REGISTERED' ? formatDateTime(item.at) : dayAndClock(item.at);
  const code = <Text style={styles.code}>{item.code}</Text>;

  return (
    <Pressable
      onPress={() => router.push(`/report/${item.incidentId}`)}
      style={({ pressed }) => [styles.card, item.unread ? styles.cardUnread : styles.cardRead, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: look.background }, look.border ? { borderWidth: 1, borderColor: look.border } : null]}>
        <Icon name={look.icon} size={18} color={look.color} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, item.unread && styles.cardTitleUnread]}>{look.title}</Text>
          {!item.unread ? <Icon name="done-all" size={14} color={colors.textMuted} /> : null}
        </View>
        <Text style={styles.cardText}>{messageFor(item, code)}</Text>
        {item.comment ? <Text style={styles.comment}>“{item.comment}”</Text> : null}
        <View style={styles.cardMeta}>
          {item.kind === 'UPDATED' ? <StatusBadge status={item.status} /> : null}
          {item.kind === 'RESOLVED' ? <Tag label="Resuelto por la Municipalidad" color="#065F46" background="#ECFDF5" border="#A7F3D0" icon="check" /> : null}
          {item.kind === 'REJECTED' ? <Tag label="Revisión técnica" color={colors.danger} background="rgba(255,218,214,0.4)" border="rgba(186,26,26,0.3)" icon="close" /> : null}
          {item.kind === 'REGISTERED' ? <Text style={styles.source}>Envío ViaDeep</Text> : null}
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
      {item.unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function messageFor(item: AppNotification, code: ReactNode): ReactNode {
  switch (item.kind) {
    case 'REGISTERED':
      return <>Se asignó el código {code} para inspección técnica.</>;
    case 'RESOLVED':
      return <>La atención de tu reporte {code} fue completada con éxito.</>;
    case 'REJECTED':
      return <>Tu reporte {code} fue rechazado tras la revisión técnica.</>;
    case 'UPDATED':
      return (
        <>
          Tu incidencia {code} pasó a <Text style={styles.statusWord}>“{CITIZEN_STATUS_LABELS[item.status]}”</Text>.
        </>
      );
  }
}

function Tag({ label, color, background, border, icon }: { label: string; color: string; background: string; border: string; icon: IconName }) {
  return (
    <View style={[styles.tag, { backgroundColor: background, borderColor: border }]}>
      <Icon name={icon} size={11} color={color} />
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: colors.surfaceBlue, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  headerIcon: { width: 32, height: 32, borderRadius: 4, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.45, color: colors.text },
  newBadge: { backgroundColor: colors.surfaceBlueSoft, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.primary },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  readAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  readAllText: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 16, letterSpacing: 0.44, color: colors.primary },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.surfaceBlue },
  chipSelected: { backgroundColor: colors.text },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  chipText: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.44, color: colors.textSecondary },
  chipTextSelected: { color: colors.white },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  dividerText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textMuted },
  dividerLine: { flex: 1, maxWidth: 192, height: 1, backgroundColor: colors.surfaceBlueStrong },
  card: { flexDirection: 'row', gap: 12, padding: 9, borderRadius: 8, borderWidth: 1, backgroundColor: colors.surface },
  cardUnread: { borderColor: 'rgba(174,198,255,0.6)' },
  cardRead: { borderColor: colors.surfaceBlue },
  icon: { width: 40, height: 40, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cardBody: { flex: 1, gap: 2, paddingRight: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
  cardTitleUnread: { fontFamily: fonts.bold },
  cardText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  statusWord: { fontFamily: fonts.medium, color: colors.primary },
  code: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.44, color: colors.text },
  comment: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingTop: 8 },
  source: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.primary },
  time: { marginLeft: 'auto', fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textMuted },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2, borderWidth: 1 },
  tagText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6 },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: 'rgba(216,226,255,0.9)',
  },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 16 },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  preferences: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBDBF5',
    backgroundColor: colors.surfaceMuted,
  },
  preferencesText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.text },
});
