import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { CITIZEN_STATUS_LABELS, type CitizenStatus } from '@/domain/display';

import { Icon, type IconName } from './icon';

type TagStyle = { background: string; border: string; color: string; icon: IconName };
type PillStyle = { background: string; border?: string; color: string; dot?: string; icon?: IconName };

const TAG: Record<CitizenStatus, TagStyle> = {
  REGISTERED: { background: colors.surfaceMuted, border: colors.borderSoft, color: colors.textSecondary, icon: 'inventory' },
  IN_REVIEW: { background: colors.surfaceBlueStrong, border: colors.border, color: colors.textSecondary, icon: 'schedule' },
  IN_PROGRESS: { background: 'rgba(0,87,192,0.1)', border: 'rgba(0,87,192,0.2)', color: colors.primary, icon: 'engineering' },
  RESOLVED: { background: 'rgba(78,222,163,0.2)', border: 'rgba(0,156,107,0.3)', color: colors.success, icon: 'check-circle-outline' },
  REJECTED: { background: 'rgba(186,26,26,0.08)', border: 'rgba(186,26,26,0.3)', color: colors.danger, icon: 'highlight-off' },
};

const PILL: Record<CitizenStatus, PillStyle> = {
  REGISTERED: { background: colors.surfaceMuted, border: 'rgba(197,198,207,0.3)', color: '#37466A', dot: colors.textMuted },
  IN_REVIEW: { background: colors.surfaceBlue, border: colors.borderFaint, color: colors.textSecondary, dot: colors.warning },
  IN_PROGRESS: { background: colors.surfaceBlueSoft, color: '#001A43', dot: colors.primary },
  RESOLVED: { background: colors.successSoft, color: '#002113', icon: 'check-circle' },
  REJECTED: { background: colors.dangerSurface, color: '#93000A', dot: colors.danger },
};

type Props = { status: CitizenStatus; variant?: 'tag' | 'pill' };

/** Estado del reporte. "tag" se usa en Inicio y "pill" en Mis reportes y el detalle. */
export function StatusBadge({ status, variant = 'pill' }: Props) {
  const label = CITIZEN_STATUS_LABELS[status];
  if (variant === 'tag') {
    const tag = TAG[status];
    return (
      <View style={[styles.tag, { backgroundColor: tag.background, borderColor: tag.border }]}>
        <Icon name={tag.icon} size={12} color={tag.color} />
        <Text style={[styles.tagText, { color: tag.color }]}>{label}</Text>
      </View>
    );
  }
  const pill = PILL[status];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: pill.background },
        pill.border ? { borderWidth: 1, borderColor: pill.border } : null,
      ]}>
      {pill.dot ? <View style={[styles.dot, { backgroundColor: pill.dot }]} /> : null}
      {pill.icon ? <Icon name={pill.icon} size={12} color={pill.color} /> : null}
      <Text style={[styles.pillText, { color: pill.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 15 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5 },
});
