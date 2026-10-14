import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

import { Icon, type IconName } from './icon';

type Variant = 'navy' | 'primary' | 'outline';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  /** El ícono va a la izquierda salvo las flechas de "continuar". */
  iconPosition?: 'left' | 'right';
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PALETTE: Record<Variant, { background: string; text: string; border?: string }> = {
  navy: { background: colors.navy, text: colors.white },
  primary: { background: colors.primary, text: colors.white },
  outline: { background: colors.surface, text: colors.text, border: colors.border },
};

export function Button({
  title,
  onPress,
  variant = 'navy',
  icon,
  iconPosition = 'left',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const palette = PALETTE[variant];
  const inactive = disabled || loading;
  const iconNode = icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={palette.text} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.small,
        { backgroundColor: palette.background },
        palette.border ? { borderWidth: 1, borderColor: palette.border } : null,
        (pressed || inactive) && styles.dimmed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {iconPosition === 'left' && iconNode}
          <Text style={[styles.label, size === 'sm' && styles.labelSmall, { color: palette.text }]}>{title}</Text>
          {iconPosition === 'right' && iconNode}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  small: { height: 40 },
  dimmed: { opacity: 0.6 },
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  labelSmall: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
});
