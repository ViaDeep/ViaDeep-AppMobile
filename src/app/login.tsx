import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';
import { useSession } from '@/session/session-context';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';

export default function LoginScreen() {
  const { user, signIn } = useSession();
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
      <KeyboardAvoidingView behavior="padding" style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>ViaDeep</Text>
          <Text style={styles.subtitle}>Reporta daños en las pistas de Lima</Text>
          <TextField
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Iniciar sesión" onPress={handleSubmit} loading={loading} />
          <Link href="/register" style={styles.link}>
            ¿No tienes cuenta? Regístrate
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 36, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  error: { color: colors.danger },
  link: { color: colors.primary, textAlign: 'center', padding: spacing.sm, fontWeight: '600' },
});
