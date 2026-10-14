import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { initials } from '@/domain/display';
import { formatPhone } from '@/domain/profile';
import { useSession } from '@/session/session-context';
import { Icon, type IconName } from '@/ui/icon';
import { InfoNote, SettingsSection } from '@/ui/settings';
import { BackHeader } from '@/ui/top-bar';

/** Datos del ciudadano solo para consulta; los cambios se hacen desde "Editar perfil". */
export default function PersonalDataScreen() {
  const { user } = useSession();

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Datos personales" step="MI CUENTA" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.fullName ?? '')}</Text>
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.name} numberOfLines={2}>
              {user?.fullName}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        <SettingsSection title="INFORMACIÓN PERSONAL">
          <DataRow first icon="person-outline" label="Nombre completo" value={user?.fullName} />
          <DataRow icon="mail-outline" label="Correo electrónico" value={user?.email} />
          <DataRow icon="smartphone" label="Celular" value={user?.phone ? formatPhone(user.phone) : null} />
          <DataRow icon="badge" label="DNI" value={user?.documentNumber} />
        </SettingsSection>

        <SettingsSection title="CUENTA">
          <DataRow first icon="verified-user" label="Tipo de cuenta" value={user?.role === 'OPERATOR' ? 'Operador municipal' : 'Ciudadano registrado'} />
          <DataRow icon="location-city" label="Ámbito" value="Lima Metropolitana" />
          <DataRow icon="lock-outline" label="Contraseña" value="••••••••" />
        </SettingsSection>

        <InfoNote>Para modificar tus datos o tu contraseña, vuelve al Perfil y toca “Editar perfil”.</InfoNote>
      </ScrollView>
    </SafeAreaView>
  );
}

function DataRow({ icon, label, value, first = false }: { icon: IconName; label: string; value?: string | null; first?: boolean }) {
  return (
    <View style={[styles.row, !first && styles.border]}>
      <View style={styles.icon}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.flexShrink}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !value && styles.empty]}>{value || 'No registrado'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  icon: { width: 36, height: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceBlue },
  label: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textSecondary },
  value: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  empty: { fontFamily: fonts.regular, color: colors.textMuted },
});
