import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import type { NotificationKind } from '@/notifications/build-notifications';
import { useReports } from '@/reports/reports-context';
import type { IconName } from '@/ui/icon';
import { InfoNote, SettingsRow, SettingsSection, SettingsSwitch } from '@/ui/settings';
import { BackHeader } from '@/ui/top-bar';

type Option = { kind: NotificationKind; icon: IconName; title: string; subtitle: string; color: string; background: string };

// Mismos íconos y colores que las tarjetas de la pestaña Notificaciones.
const OPTIONS: Option[] = [
  {
    kind: 'REGISTERED',
    icon: 'assignment',
    title: 'Reporte registrado',
    subtitle: 'Confirmación cuando tu reporte llega a la municipalidad',
    color: colors.primary,
    background: colors.surfaceBlue,
  },
  {
    kind: 'UPDATED',
    icon: 'engineering',
    title: 'Cambios de estado',
    subtitle: 'Cuando tu reporte pasa a revisión o a reparación',
    color: colors.primary,
    background: colors.surfaceBlueStrong,
  },
  {
    kind: 'RESOLVED',
    icon: 'task-alt',
    title: 'Incidencia resuelta',
    subtitle: 'Cuando la municipalidad termina la reparación',
    color: '#059669',
    background: '#ECFDF5',
  },
  {
    kind: 'REJECTED',
    icon: 'block',
    title: 'Reporte rechazado',
    subtitle: 'Cuando el reporte no procede, con el motivo',
    color: colors.danger,
    background: 'rgba(255,218,214,0.4)',
  },
];

export default function NotificationPreferencesScreen() {
  const { preferences, setPreference } = useReports();

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Preferencias de avisos" step="ALERTAS" />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="AVISOS SOBRE MIS REPORTES" footer="Los avisos desactivados dejan de aparecer en la pestaña Notificaciones y en su contador.">
          {OPTIONS.map((option, index) => (
            <SettingsRow
              key={option.kind}
              first={index === 0}
              icon={option.icon}
              iconColor={option.color}
              iconBackground={option.background}
              title={option.title}
              subtitle={option.subtitle}
              right={
                <SettingsSwitch
                  label={option.title}
                  value={preferences[option.kind]}
                  onChange={(enabled) => setPreference(option.kind, enabled)}
                />
              }
            />
          ))}
        </SettingsSection>

        <InfoNote icon="phonelink-ring">
          Por ahora los avisos se muestran dentro de la app. Las notificaciones push en el celular llegarán con el
          servicio de notificaciones de la plataforma.
        </InfoNote>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
});
