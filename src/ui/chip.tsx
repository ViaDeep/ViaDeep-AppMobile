import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/constants/theme';

import { Icon, type IconName } from './icon';

type Props = {
  label: string;
  /** Color del punto de estado a la izquierda. */
  dot?: string;
  icon?: IconName;
  background?: string;
  border?: string;
  color?: string;
  /** "pill" redondeado o "tag" casi cuadrado, como en los mockups. */
  shape?: 'pill' | 'tag';
  style?: StyleProp<ViewStyle>;
};

/** Etiqueta pequeña en JetBrains Mono (por ejemplo "LIMA METRO", "CAM 01", "NPU ACTIVO"). */
export function Chip({
  label,
  dot,
  icon,
  background = colors.surfaceMuted,
  border,
  color = colors.textSecondary,
  shape = 'pill',
  style,
}: Props) {
  return (
    <View
      style={[
        styles.chip,
        shape === 'tag' && styles.tag,
        { backgroundColor: background },
        border ? { borderWidth: 1, borderColor: border } : null,
        style,
      ]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {icon ? <Icon name={icon} size={12} color={color} /> : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tag: { borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
});
