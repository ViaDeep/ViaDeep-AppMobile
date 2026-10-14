import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { STATUS_LABELS, type IncidentStatus } from '@/domain/incident';

const STATUS_COLORS: Record<IncidentStatus, string> = {
  PENDING: colors.warning,
  IN_PROGRESS: colors.primary,
  RESOLVED: colors.success,
  REJECTED: colors.danger,
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]}>
      <Text style={styles.text}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  text: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
