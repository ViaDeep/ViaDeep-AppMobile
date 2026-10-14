import { forwardRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

import { Icon, type IconName } from './icon';

type Props = TextInputProps & {
  label: string;
  icon: IconName;
  /** Muestra el botón del ojo para ver u ocultar la contraseña. */
  password?: boolean;
  /** Enlace o texto a la derecha de la etiqueta (por ejemplo "¿Olvidaste tu contraseña?"). */
  labelAccessory?: ReactNode;
  error?: string | null;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, icon, password = false, labelAccessory, error, style, ...input },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelAccessory}
      </View>
      <View style={styles.inputRow}>
        <View style={styles.leftIcon} pointerEvents="none">
          <Icon name={icon} size={18} color={colors.textMuted} />
        </View>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={password && hidden}
          style={[styles.input, password && styles.inputWithToggle, error ? styles.inputError : null, style]}
          {...input}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            onPress={() => setHidden((value) => !value)}
            hitSlop={8}
            style={styles.toggle}>
            <Icon name={hidden ? 'visibility' : 'visibility-off'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 6, width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.text },
  inputRow: { justifyContent: 'center' },
  leftIcon: { position: 'absolute', left: 14, zIndex: 1 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: 45,
    paddingRight: 17,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  inputWithToggle: { paddingRight: 45 },
  inputError: { borderColor: colors.danger },
  toggle: { position: 'absolute', right: 14 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
});
