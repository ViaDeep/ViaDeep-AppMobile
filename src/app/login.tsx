import { Link, Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { useSession } from '@/session/session-context';
import { AuthBackdrop } from '@/ui/auth-backdrop';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { comingSoon } from '@/ui/coming-soon';
import { Icon } from '@/ui/icon';
import { Logo } from '@/ui/logo';
import { TextField } from '@/ui/text-field';

export default function LoginScreen() {
  const { user, signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Redirect href="/" />;
  }

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AuthBackdrop />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <Chip label="Portal Ciudadano Oficial" dot={colors.successBright} border={colors.borderSoft} />
            <View style={styles.place}>
              <Icon name="location-on" size={13} color={colors.textSecondary} />
              <Text style={styles.placeText}>Lima Metropolitana</Text>
            </View>
          </View>

          <View style={styles.brand}>
            <Logo />
            <Text style={styles.institution}>Municipalidad Metropolitana de Lima</Text>
            <Text style={styles.title}>Reporta una incidencia vial</Text>
            <Text style={styles.subtitle}>Ayuda a mejorar las vías de Lima en segundos.</Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Correo electrónico"
              icon="mail-outline"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Contraseña"
              icon="lock-outline"
              password
              placeholder="••••••••••••"
              value={password}
              onChangeText={setPassword}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              labelAccessory={
                <Pressable onPress={() => comingSoon('Recuperar contraseña')} hitSlop={8}>
                  <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
              }
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button title="Iniciar sesión" icon="arrow-forward" iconPosition="right" onPress={handleSubmit} loading={loading} style={styles.submit} />
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>o continúa con</Text>
            <View style={styles.line} />
          </View>

          <Button
            title="DNIe / Identidad Digital Nacional"
            variant="outline"
            icon="badge"
            onPress={() => comingSoon('DNIe / Identidad Digital Nacional')}
            style={styles.dni}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
            <Link href="/register" style={styles.registerLink}>
              Crear cuenta
            </Link>
          </View>

          <View style={styles.spacer} />

          <View style={styles.footer}>
            <Text style={styles.legal}>
              Al continuar, aceptas los <Text style={styles.underline}>Términos y Condiciones</Text> y la{' '}
              <Text style={styles.underline}>Política de Privacidad</Text> de la Municipalidad de Lima.
            </Text>
            <Chip label="ViaDeep v2.4 · Lima Metropolitana" dot={colors.primary} shape="tag" border="rgba(197,198,207,0.5)" style={styles.version} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeText: { fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 0.6, color: colors.textSecondary },
  brand: { paddingBottom: 24 },
  institution: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 12, marginBottom: 12 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 4 },
  form: { gap: 16 },
  link: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.primary },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  submit: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: colors.borderSoft },
  dividerText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  dni: { height: 44, marginTop: 16 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 24 },
  registerText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  registerLink: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.primary },
  spacer: { flex: 1, minHeight: 32 },
  footer: { alignItems: 'center', gap: 8 },
  legal: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
  underline: { textDecorationLine: 'underline' },
  version: { alignSelf: 'center' },
});
