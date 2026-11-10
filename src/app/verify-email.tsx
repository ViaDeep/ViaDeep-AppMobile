import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth-api';
import { colors, fonts } from '@/constants/theme';
import { useSession } from '@/session/session-context';
import { AuthBackdrop } from '@/ui/auth-backdrop';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { Logo } from '@/ui/logo';
import { TextField } from '@/ui/text-field';

/** Segundos que el backend pide esperar entre dos envíos del código. */
const RESEND_WAIT = 60;

/** Confirma el correo con el código de 6 dígitos que se envió al registrarse. Al acertar, inicia sesión. */
export default function VerifyEmailScreen() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { user, signInWithToken } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(RESEND_WAIT);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  if (user) {
    return <Redirect href="/" />;
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(code)) {
      setError('Escribe los 6 dígitos del código.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithToken(await authApi.verifyEmail(email, code));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar el correo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    try {
      await authApi.resendVerification(email);
      setNotice('Te enviamos un código nuevo. Revisa también la carpeta de spam.');
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reenviar el código.');
    } finally {
      setWait(RESEND_WAIT);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackdrop />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.back}>
            <Icon name="arrow-back" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.brand}>
            <Logo />
            <View style={styles.badge}>
              <Icon name="mark-email-read" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Confirma tu correo</Text>
            <Text style={styles.subtitle}>
              Te enviamos un código de 6 dígitos a <Text style={styles.email}>{email}</Text>. Escríbelo para activar tu
              cuenta.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Código de verificación"
              icon="pin"
              placeholder="000000"
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              returnKeyType="go"
              onSubmitEditing={handleVerify}
              style={styles.codeInput}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            {notice && <Text style={styles.notice}>{notice}</Text>}
            <Button title="Confirmar y entrar" icon="arrow-forward" iconPosition="right" onPress={handleVerify} loading={loading} />
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>¿No te llegó?</Text>
            {wait > 0 ? (
              <Text style={styles.resendWait}>Reenviar en {wait} s</Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={8}>
                <Text style={styles.resendLink}>Reenviar código</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.hint}>El código vence en 15 minutos. Revisa también la carpeta de spam o promociones.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  back: { width: 36, height: 36, borderRadius: 4, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  brand: { paddingTop: 16, paddingBottom: 24 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 4 },
  email: { fontFamily: fonts.semibold, color: colors.textStrong },
  form: { gap: 16 },
  codeInput: { fontFamily: fonts.monoBold, fontSize: 20, letterSpacing: 8 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  notice: { fontFamily: fonts.medium, fontSize: 13, color: colors.success },
  resendRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 24 },
  resendText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  resendWait: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  resendLink: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.primary },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: 'center', marginTop: 12 },
});
