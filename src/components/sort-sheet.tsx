import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { Icon, type IconName } from '@/ui/icon';

export type ReportOrder = 'NEWEST' | 'OLDEST';

const OPTIONS: { key: ReportOrder; icon: IconName; title: string; description: string }[] = [
  { key: 'NEWEST', icon: 'south', title: 'Más recientes primero', description: 'Tus últimos reportes aparecen arriba' },
  { key: 'OLDEST', icon: 'north', title: 'Más antiguos primero', description: 'Empieza por tu primer reporte' },
];

type Props = {
  visible: boolean;
  value: ReportOrder;
  onChange: (order: ReportOrder) => void;
  onClose: () => void;
};

/** Hoja inferior para elegir el orden de Mis reportes. */
export function SortSheet({ visible, value, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <View style={styles.headIcon}>
            <Icon name="sort" size={20} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>Ordenar reportes</Text>
            <Text style={styles.subtitle}>Elige cómo ver tu lista por fecha de registro</Text>
          </View>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((option) => {
            const selected = option.key === value;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(option.key);
                  onClose();
                }}
                style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}>
                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  <Icon name={option.icon} size={18} color={selected ? colors.white : colors.textSecondary} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <Icon
                  name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={selected ? colors.primary : colors.border}
                />
              </Pressable>
            );
          })}
        </View>

        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,32,66,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.45, color: colors.textStrong },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  optionPressed: { opacity: 0.7 },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.primary },
  optionTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  optionTitleSelected: { color: colors.primary },
  optionDescription: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
  cancel: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textStrong },
});
