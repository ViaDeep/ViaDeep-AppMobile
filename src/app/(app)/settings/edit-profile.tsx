import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi } from '@/api/auth-api';
import { colors, fonts } from '@/constants/theme';
import { initials } from '@/domain/display';
import { validatePasswordChange, validateProfile, type ProfileErrors } from '@/domain/profile';
import { useSession } from '@/session/session-context';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { SettingsSection } from '@/ui/settings';
import { TextField } from '@/ui/text-field';
import { BackHeader } from '@/ui/top-bar';

export default function EditProfileScreen() {
  const { user, updateUser } = useSession();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [documentNumber, setDocumentNumber] = useState(user?.documentNumber ?? '');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const changed =
    fullName.trim() !== (user?.fullName ?? '') ||
    phone.trim() !== (user?.phone ?? '') ||
    documentNumber.trim() !== (user?.documentNumber ?? '');

  async function saveProfile() {
    const form = { fullName: fullName.trim(), phone: phone.trim(), documentNumber: documentNumber.trim() };
    const found = validateProfile(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      updateUser(await authApi.updateProfile(form));
      Alert.alert('Perfil actualizado', 'Tus datos se guardaron correctamente.', [{ text: 'Listo', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('No se pudo guardar', e instanceof Error ? e.message : 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    const problem = validatePasswordChange({ current, next, confirm });
    setPasswordError(problem);
    if (problem) return;
    setChangingPassword(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      Alert.alert('Contraseña actualizada', 'Usa la nueva contraseña la próxima vez que inicies sesión.');
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Editar perfil" step="DATOS PERSONALES" />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(fullName || user?.fullName || '')}</Text>
            </View>
            <View style={styles.flexShrink}>
              <Text style={styles.name} numberOfLines={1}>
                {fullName.trim() || 'Tu nombre'}
              </Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
          </View>

          <SettingsSection title="INFORMACIÓN PERSONAL" footer="El celular y el DNI son opcionales. Ayudan a la municipalidad a contactarte sobre tus reportes.">
            <View style={styles.form}>
              <TextField
                label="Nombre completo"
                icon="person-outline"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                maxLength={120}
                error={errors.fullName}
              />
              <TextField
                label="Correo electrónico"
                icon="lock-outline"
                value={user?.email ?? ''}
                editable={false}
                style={styles.readOnly}
                labelAccessory={<Text style={styles.hint}>No se puede cambiar</Text>}
              />
              <TextField
                label="Celular"
                icon="smartphone"
                value={phone}
                onChangeText={(value) => setPhone(value.replace(/\D/g, ''))}
                keyboardType="phone-pad"
                maxLength={9}
                placeholder="987654321"
                error={errors.phone}
              />
              <TextField
                label="DNI"
                icon="badge"
                value={documentNumber}
                onChangeText={(value) => setDocumentNumber(value.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={8}
                placeholder="12345678"
                error={errors.documentNumber}
              />
              <Button title="Guardar cambios" icon="save" onPress={() => void saveProfile()} loading={saving} disabled={!changed} />
            </View>
          </SettingsSection>

          <SettingsSection title="SEGURIDAD">
            <View style={styles.form}>
              <View style={styles.securityHeader}>
                <Icon name="key" size={16} color={colors.primary} />
                <Text style={styles.securityTitle}>Cambiar contraseña</Text>
              </View>
              <TextField label="Contraseña actual" icon="lock-outline" password value={current} onChangeText={setCurrent} autoCapitalize="none" />
              <TextField
                label="Nueva contraseña"
                icon="lock-reset"
                password
                value={next}
                onChangeText={setNext}
                autoCapitalize="none"
                placeholder="Mínimo 8 caracteres"
              />
              <TextField label="Confirmar nueva contraseña" icon="lock-reset" password value={confirm} onChangeText={setConfirm} autoCapitalize="none" />
              {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
              <Button
                title="Actualizar contraseña"
                variant="outline"
                icon="lock"
                onPress={() => void savePassword()}
                loading={changingPassword}
              />
            </View>
          </SettingsSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.navy,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 18, letterSpacing: -0.45, color: colors.white },
  name: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.white },
  email: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.4, color: 'rgba(255,255,255,0.7)' },
  form: { padding: 14, gap: 14 },
  readOnly: { backgroundColor: colors.surfaceMuted, color: colors.textMuted },
  hint: { fontFamily: fonts.mono, fontSize: 10, color: colors.textMuted },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  securityTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textStrong },
  error: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.danger },
});
