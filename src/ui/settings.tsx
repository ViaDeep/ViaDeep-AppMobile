import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

import { Icon, type IconName } from './icon';

/** Bloque con título en mayúsculas y una tarjeta blanca, como los del Perfil. */
export function SettingsSection({ title, children, footer }: { title: string; children: ReactNode; footer?: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
      {footer ? <Text style={styles.sectionFooter}>{footer}</Text> : null}
    </View>
  );
}

type RowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  /** La primera fila de una tarjeta no lleva línea superior. */
  first?: boolean;
  iconColor?: string;
  iconBackground?: string;
  right?: ReactNode;
  onPress?: () => void;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  first = false,
  iconColor = colors.primary,
  iconBackground = colors.surfaceBlue,
  right,
  onPress,
}: RowProps) {
  const content = (
    <>
      <View style={styles.left}>
        <View style={[styles.icon, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={18} color={colors.textMuted} /> : null)}
    </>
  );
  if (!onPress) {
    return <View style={[styles.row, !first && styles.border]}>{content}</View>;
  }
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !first && styles.border, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function SettingsSwitch({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      onValueChange={onChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.border}
    />
  );
}

/** Aviso informativo con fondo azul claro. */
export function InfoNote({ icon = 'info-outline', children }: { icon?: IconName; children: ReactNode }) {
  return (
    <View style={styles.note}>
      <Icon name={icon} size={16} color={colors.primary} />
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

/** Etiqueta pequeña de estado (por ejemplo "PERMITIDO"). */
export function StateTag({ label, tone }: { label: string; tone: 'success' | 'warning' | 'muted' }) {
  const palette = {
    success: { background: colors.successSurface, text: colors.success },
    warning: { background: colors.warningSurface, text: colors.warningText },
    muted: { background: colors.surfaceMuted, text: colors.textSecondary },
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: palette.background }]}>
      <Text style={[styles.tagText, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  sectionTitle: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.6,
    color: colors.textSecondary,
    paddingHorizontal: 2,
  },
  sectionFooter: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, paddingHorizontal: 2 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderFaint, borderRadius: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  pressed: { opacity: 0.7 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  icon: { width: 36, height: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  texts: { flexShrink: 1 },
  title: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  note: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,87,192,0.15)',
    backgroundColor: colors.surfaceMuted,
  },
  noteText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  tagText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
});
