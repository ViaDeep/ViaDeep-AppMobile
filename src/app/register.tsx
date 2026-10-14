import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth-api';
import { colors, fonts } from '@/constants/theme';
import { AuthBackdrop } from '@/ui/auth-backdrop';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Icon } from '@/ui/icon';
import { Logo } from '@/ui/logo';
import { TextField } from '@/ui/text-field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = { fullName?: string; email?: string; password?: string; form?: string };

/** El Figma solo trae el login; el registro sigue su mismo estilo. */
export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const found: Errors = {};
    if (!fullName.trim()) found.fullName = 'Ingresa tu nombre completo.';
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Ingresa un correo válido.';
    if (password.length < 8) found.password = 'La contraseña debe tener al menos 8 caracteres.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await authApi.register(fullName.trim(), email.trim(), password);
      Alert.alert('Cuenta creada', 'Ya puedes iniciar sesión con tu correo y contraseña.');
      router.back();
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : 'No se pudo crear la cuenta.' });
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
            <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.back}>
              <Icon name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <Chip label="Portal Ciudadano Oficial" dot={colors.successBright} border={colors.borderSoft} />
          </View>

          <View style={styles.brand}>
            <Logo />
            <Text style={styles.institution}>Municipalidad Metropolitana de Lima</Text>
            <Text style={styles.title}>Crea tu cuenta ciudadana</Text>
            <Text style={styles.subtitle}>Con tu cuenta podrás enviar reportes y seguir su estado hasta que se reparen.</Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Nombre completo"
              icon="person-outline"
              placeholder="Nombre y apellido"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              error={errors.fullName}
            />
            <TextField
              label="Correo electrónico"
              icon="mail-outline"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={errors.email}
            />
            <TextField
              label="Contraseña"
              icon="lock-outline"
              password
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            {errors.form && <Text style={styles.error}>{errors.form}</Text>}
            <Button title="Crear cuenta" icon="arrow-forward" iconPosition="right" onPress={handleSubmit} loading={loading} style={styles.submit} />
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </Pressable>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 },
  back: { width: 36, height: 36, borderRadius: 4, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  brand: { paddingBottom: 24 },
  institution: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 12, marginBottom: 12 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 4 },
  form: { gap: 16 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  submit: { marginTop: 8 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 24 },
  loginText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  loginLink: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.primary },
});
