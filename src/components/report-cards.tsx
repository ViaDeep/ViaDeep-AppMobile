import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { citizenStatus, formatCoordinates, formatDateTime, relativeTime, reportCode } from '@/domain/display';
import { TYPE_LABELS, type IncidentDetail, type IncidentSummary } from '@/domain/incident';
import { TYPE_ICONS } from '@/domain/type-icons';
import { useEvidenceUrl } from '@/reports/use-evidence-url';
import { Icon } from '@/ui/icon';
import { StatusBadge } from '@/ui/status-badge';

/** Distrito si el backend ya lo identificó; si no, las coordenadas. */
export function placeLabel(incident: Pick<IncidentSummary, 'district' | 'latitude' | 'longitude'>): string {
  return incident.district ?? formatCoordinates(incident.latitude, incident.longitude);
}

type CardProps = { incident: IncidentDetail; onPress: () => void };

/** Tarjeta compacta de la pantalla de Inicio. */
export function RecentReportCard({ incident, onPress }: CardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.recent, pressed && styles.pressed]}>
      <View style={styles.recentBody}>
        <View style={styles.row}>
          <View style={styles.codeTag}>
            <Text style={styles.codeTagText}>{reportCode(incident.id, incident.createdAt)}</Text>
          </View>
          <Text style={styles.time}>{relativeTime(incident.createdAt)}</Text>
        </View>
        <Text style={styles.recentTitle} numberOfLines={1}>
          {TYPE_LABELS[incident.type]}
        </Text>
        <View style={styles.row}>
          <Icon name="location-on" size={12} color={colors.textSecondary} />
          <Text style={styles.address} numberOfLines={1}>
            {placeLabel(incident)}
          </Text>
        </View>
      </View>
      <StatusBadge status={citizenStatus(incident.status, incident.severity)} variant="tag" />
    </Pressable>
  );
}

/** Tarjeta con miniatura de la pantalla Mis reportes. */
export function ReportListCard({ incident, onPress }: CardProps) {
  const photo = useEvidenceUrl(incident.evidenceId);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}>
      <View style={styles.listHeader}>
        <Text style={styles.listCode}>{reportCode(incident.id, incident.createdAt)}</Text>
        <StatusBadge status={citizenStatus(incident.status, incident.severity)} />
      </View>
      <View style={styles.listBody}>
        <View style={styles.thumb}>
          {photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          ) : (
            <Icon name="image" size={24} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.listInfo}>
          <View style={styles.row}>
            <Icon name={TYPE_ICONS[incident.type]} size={14} color={colors.primary} />
            <Text style={styles.listTitle} numberOfLines={1}>
              {TYPE_LABELS[incident.type]}
            </Text>
          </View>
          <View style={styles.row}>
            <Icon name="location-on" size={12} color={colors.textSecondary} />
            <Text style={styles.address} numberOfLines={1}>
              {placeLabel(incident)}
            </Text>
          </View>
          <Text style={styles.date}>{formatDateTime(incident.createdAt)}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recent: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.5)',
    borderRadius: 8,
    padding: 15,
  },
  recentBody: { flex: 1, gap: 4 },
  codeTag: { backgroundColor: colors.surfaceBlue, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4 },
  codeTagText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  time: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 15, color: colors.textMuted },
  recentTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22.5, color: colors.textStrong },
  address: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 8,
    padding: 13,
    gap: 10,
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197,198,207,0.3)',
  },
  listCode: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 16, letterSpacing: 0.44, color: colors.text },
  listBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: { flex: 1, gap: 2 },
  listTitle: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22.5, color: colors.textStrong },
  date: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 15, letterSpacing: -0.25, color: colors.textMuted, paddingTop: 2 },
});
