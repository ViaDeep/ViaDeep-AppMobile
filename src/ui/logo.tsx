import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import { colors, fonts } from '@/constants/theme';

/** Isotipo de ViaDeep: una vía en perspectiva sobre fondo azul marino. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Rect width={36} height={36} rx={8} fill={colors.navy} />
      <Path d="M8 29 L15 8" stroke="#2F8CFF" strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M28 29 L21 8" stroke="#2F8CFF" strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M13 10 H23" stroke={colors.successBright} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={18} y1={14} x2={18} y2={29} stroke={colors.successBright} strokeWidth={2} strokeDasharray="3 3" />
    </Svg>
  );
}

type LogoProps = { size?: 'sm' | 'md'; tagline?: boolean };

/** Logotipo completo: isotipo, nombre y lema. */
export function Logo({ size = 'md', tagline = true }: LogoProps) {
  const small = size === 'sm';
  return (
    <View style={styles.row}>
      <LogoMark size={small ? 24 : 36} />
      <View>
        <Text style={[styles.name, small && styles.nameSmall]}>
          Via<Text style={styles.accent}>Deep</Text>
        </Text>
        {tagline && <Text style={[styles.tagline, small && styles.taglineSmall]}>ON-DEVICE SMART ROAD AI</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 20, color: colors.navy, letterSpacing: -0.4 },
  nameSmall: { fontSize: 12, lineHeight: 14 },
  accent: { color: colors.primaryBright },
  tagline: { fontFamily: fonts.bold, fontSize: 7, letterSpacing: 0.6, color: colors.textMuted },
  taglineSmall: { fontSize: 5 },
});
