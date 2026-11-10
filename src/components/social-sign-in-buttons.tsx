import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { authApi } from '@/api/auth-api';
import { getIdToken, type SocialProvider } from '@/auth/social-sign-in';
import { colors, fonts, radius } from '@/constants/theme';
import { useSession } from '@/session/session-context';

type Props = {
  /** Muestra el error en la pantalla que contiene los botones. */
  onError: (message: string | null) => void;
  disabled?: boolean;
};

/** Botones "Google" y "Outlook". Si el correo no tiene cuenta, se crea una de ciudadano ya verificada. */
export function SocialSignInButtons({ onError, disabled = false }: Props) {
  const { signInWithToken } = useSession();
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  async function handlePress(provider: SocialProvider) {
    onError(null);
    setBusy(provider);
    try {
      const idToken = await getIdToken(provider);
      if (idToken) {
        await signInWithToken(await authApi.socialLogin(provider, idToken));
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.row}>
      <SocialButton label="Google" logo={<GoogleLogo />} busy={busy === 'google'} disabled={disabled || busy !== null}
        onPress={() => handlePress('google')} />
      <SocialButton label="Outlook" logo={<MicrosoftLogo />} busy={busy === 'microsoft'}
        disabled={disabled || busy !== null} onPress={() => handlePress('microsoft')} />
    </View>
  );
}

function SocialButton({ label, logo, busy, disabled, onPress }: {
  label: string;
  logo: ReactNode;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continuar con ${label}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && !busy && styles.dimmed]}>
      {busy ? <ActivityIndicator size="small" color={colors.primary} /> : logo}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

function MicrosoftLogo() {
  return (
    <Svg width={16} height={16} viewBox="0 0 22 22">
      <Rect x={0} y={0} width={10} height={10} fill="#F25022" />
      <Rect x={12} y={0} width={10} height={10} fill="#7FBA00" />
      <Rect x={0} y={12} width={10} height={10} fill="#00A4EF" />
      <Rect x={12} y={12} width={10} height={10} fill="#FFB900" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
  dimmed: { opacity: 0.5 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
});
