import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text } from 'react-native';

import { authApi } from '@/api/auth-api';
import { colors, spacing } from '@/constants/theme';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim()) {
      return setError('Ingresa tu nombre.');
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      return setError('Ingresa un correo válido.');
    }
    if (password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres.');
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.register(fullName.trim(), email.trim(), password);
      Alert.alert('Cuenta creada', 'Ya puedes iniciar sesión.');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TextField label="Nombre completo" value={fullName} onChangeText={setFullName} autoComplete="name" />
        <TextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextField
          label="Contraseña (mínimo 8 caracteres)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Crear cuenta" onPress={handleSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  error: { color: colors.danger },
});
