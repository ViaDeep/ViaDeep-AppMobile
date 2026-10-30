import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { inferenceEngine } from '@/inference/engine';

import { Chip } from './chip';
import { Icon } from './icon';
import { LogoMark } from './logo';

/** Chip que indica si el modelo de IA corre en el celular o si la app está en modo manual. */
export function EngineChip() {
  return inferenceEngine.available ? (
    <Chip label="NPU ACTIVO" dot={colors.success} background={colors.surfaceBlue} border={colors.borderSoft} color={colors.navy} style={styles.centered} />
  ) : (
    <Chip label="MODO MANUAL" dot={colors.warning} background={colors.surfaceBlue} border={colors.borderSoft} color={colors.navy} style={styles.centered} />
  );
}

/** Cabecera con la marca ViaDeep, usada en Mis reportes y Perfil. */
export function BrandHeader({ section }: { section?: string }) {
  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <LogoMark size={24} />
        <Text style={styles.brand}>ViaDeep</Text>
        {section ? (
          <>
            <View style={styles.separator} />
            <Text style={styles.section}>{section}</Text>
          </>
        ) : null}
      </View>
      <EngineChip />
    </View>
  );
}

type BackHeaderProps = {
  title: string;
  /** Texto pequeño sobre el título, por ejemplo "PASO 03 DE 04". */
  step?: string;
  right?: ReactNode;
  onBack?: () => void;
  /** "centered" pone el título al centro (Resultado del análisis). */
  centered?: boolean;
};

/** Cabecera con botón de volver, usada en el flujo de reporte y en el detalle. */
export function BackHeader({ title, step, right, onBack, centered = false }: BackHeaderProps) {
  return (
    <View style={[styles.bar, styles.backBar]}>
      <View style={[styles.row, centered && styles.flex]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={onBack ?? (() => router.back())}
          hitSlop={6}
          style={styles.backButton}>
          <Icon name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <View style={centered ? styles.centeredTitle : null}>
          {step && centered ? <Text style={[styles.step, styles.stepAccent]}>{step}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {step && !centered ? <Text style={styles.step}>{step}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  backBar: { paddingVertical: 8, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  centered: { alignSelf: 'center' },
  flex: { flex: 1 },
  brand: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.45, color: colors.text },
  separator: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderSoft },
  section: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textSecondary },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredTitle: { flex: 1, alignItems: 'center', marginRight: 36 },
  title: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.45, color: colors.text },
  step: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textMuted },
  stepAccent: { fontFamily: fonts.monoBold, color: colors.primary },
});
