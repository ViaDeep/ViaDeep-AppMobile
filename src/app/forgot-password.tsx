import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth-api';
import { colors, fonts } from '@/constants/theme';
import { AuthBackdrop } from '@/ui/auth-backdrop';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { Logo } from '@/ui/logo';
import { TextField } from '@/ui/text-field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { email?: string; code?: string; password?: string; confirm?: string; form?: string };

/** "¿Olvidaste tu contraseña?": primero se pide un código al correo y luego se elige la contraseña nueva. */
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function requestCode() {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrors({ email: 'Ingresa un correo válido.' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('reset');
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'No se pudo enviar el código.' });
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    const found: Errors = {};
    if (!/^\d{6}$/.test(code)) found.code = 'Escribe los 6 dígitos del código.';
    if (password.length < 8) found.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (confirm !== password) found.confirm = 'Las contraseñas no coinciden.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), code, password);
      Alert.alert('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      router.back();
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackdrop />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => (step === 'reset' ? setStep('email') : router.back())}
            style={styles.back}>
            <Icon name="arrow-back" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.brand}>
            <Logo />
            <View style={styles.badge}>
              <Icon name={step === 'email' ? 'lock-reset' : 'mark-email-read'} size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>{step === 'email' ? 'Recupera tu contraseña' : 'Crea una contraseña nueva'}</Text>
            <Text style={styles.subtitle}>
              {step === 'email' ? (
                'Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos.'
              ) : (
                <>
                  Si <Text style={styles.email}>{email.trim()}</Text> tiene una cuenta, le llegó un código. Escríbelo junto
                  con tu nueva contraseña.
                </>
              )}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'email' ? (
              <>
                <TextField
                  label="Correo electrónico"
                  icon="mail-outline"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="send"
                  onSubmitEditing={requestCode}
                  error={errors.email}
                />
                {errors.form && <Text style={styles.error}>{errors.form}</Text>}
                <Button title="Enviar código" icon="send" iconPosition="right" onPress={requestCode} loading={loading} />
              </>
            ) : (
              <>
                <TextField
                  label="Código del correo"
                  icon="pin"
                  placeholder="000000"
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  error={errors.code}
                  style={styles.codeInput}
                />
                <TextField
                  label="Nueva contraseña"
                  icon="lock-outline"
                  password
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChangeText={setPassword}
                  error={errors.password}
                />
                <TextField
                  label="Repite la contraseña"
                  icon="lock-outline"
                  password
                  placeholder="Mínimo 8 caracteres"
                  value={confirm}
                  onChangeText={setConfirm}
                  error={errors.confirm}
                />
                {errors.form && <Text style={styles.error}>{errors.form}</Text>}
                <Button title="Cambiar contraseña" icon="check" iconPosition="right" onPress={resetPassword} loading={loading} />
                <Pressable onPress={requestCode} hitSlop={8} style={styles.resend}>
                  <Text style={styles.resendLink}>Enviar otro código</Text>
                </Pressable>
              </>
            )}
          </View>
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
  resend: { alignSelf: 'center', marginTop: 4 },
  resendLink: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.primary },
});
