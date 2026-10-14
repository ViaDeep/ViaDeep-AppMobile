import { Redirect, router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { colors, fonts } from '@/constants/theme';
import { formatCoordinates, formatDateTime, reportCode } from '@/domain/display';
import { TYPE_LABELS } from '@/domain/incident';
import { TYPE_ICONS } from '@/domain/type-icons';
import { useReportFlow } from '@/report-flow/report-flow';
import { acceptedDetection } from '@/services/report-service';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Icon, type IconName } from '@/ui/icon';

export default function ConfirmationScreen() {
  const flow = useReportFlow();
  const { capture, submitted } = flow;
  if (!capture || !submitted) {
    return <Redirect href="/" />;
  }

  const type = acceptedDetection(flow.detection, env.aiConfidenceThreshold)?.type ?? flow.manualType;
  const place = capture.address ?? formatCoordinates(capture.coordinates.latitude, capture.coordinates.longitude);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Chip
          label="PASO 04 DE 04 · REGISTRADO"
          dot={colors.primary}
          background={colors.surfaceBlueStrong}
          border={colors.border}
          style={styles.step}
        />

        <View style={styles.hero}>
          <View style={styles.halo}>
            <View style={styles.glow} />
            <View style={styles.iconRing}>
              <View style={styles.iconCore}>
                <Icon name="check" size={26} color={colors.successSoft} />
              </View>
            </View>
          </View>
          <Text style={styles.title}>¡Reporte registrado correctamente!</Text>
          <Text style={styles.subtitle}>Tu incidencia fue enviada a la Municipalidad Metropolitana de Lima.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.eyebrow}>CÓDIGO DE GESTIÓN</Text>
            <View style={styles.codeChip}>
              <Text style={styles.codeChipText}>ID: {reportCode(submitted.id, submitted.createdAt)}</Text>
            </View>
          </View>
          <View style={styles.rowBetween}>
            <InfoRow icon={type ? TYPE_ICONS[type] : 'report-problem'} label="Tipo de daño" value={type ? TYPE_LABELS[type] : '—'} />
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Registrada</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <InfoRow icon="location-on" label="Ubicación geolocalizada" value={place} />
          <View style={styles.divider} />
          <InfoRow icon="event" label="Fecha de ingreso" value={formatDateTime(submitted.createdAt)} />
        </View>

        <View style={styles.next}>
          <View style={styles.nextHeader}>
            <Icon name="info-outline" size={17} color={colors.navy} />
            <Text style={styles.nextTitle}>¿Qué sucede ahora?</Text>
          </View>
          <Step number={1}>
            El reporte será validado por el equipo técnico de fiscalización de la <Text style={styles.bold}>Municipalidad</Text>.
          </Step>
          <Step number={2}>Podrá ser asignado a la cuadrilla de mantenimiento vial distrital para su pronta atención.</Step>
          <Step number={3}>
            Podrás consultar actualizaciones y estado de obra directamente en <Text style={styles.bold}>“Mis Reportes”</Text>.
          </Step>
        </View>

        <View style={styles.actions}>
          <Button
            title="Ver mi reporte"
            icon="visibility"
            onPress={() => router.replace(`/report/${submitted.id}`)}
            style={styles.action}
          />
          <Button title="Volver al inicio" variant="outline" icon="home" onPress={() => router.dismissTo('/')} style={styles.action} />
        </View>

        <View style={styles.footer}>
          <Icon name="account-balance" size={12} color={colors.textSecondary} />
          <Text style={styles.footerText}>ViaDeep · Municipalidad Metropolitana de Lima</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.flexShrink}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 24 },
  step: { alignSelf: 'stretch', justifyContent: 'center' },
  hero: { alignItems: 'center', gap: 8 },
  halo: { width: 64, height: 64, marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 80, height: 80, borderRadius: 16, backgroundColor: colors.successSoft, opacity: 0.4 },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.successBright,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCore: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#002718', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.navy, textAlign: 'center', maxWidth: 260 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center', maxWidth: 300 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 21,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eyebrow: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textSecondary },
  codeChip: { backgroundColor: colors.surfaceBlue, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 },
  codeChipText: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 16, letterSpacing: 0.275, color: colors.primary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  infoIcon: { width: 28, height: 28, borderRadius: 2, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  infoValue: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceBlue,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  statusText: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 16, letterSpacing: 0.44, color: colors.text },
  divider: { height: 1, backgroundColor: colors.surfaceMuted },
  next: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 21,
    gap: 12,
  },
  nextHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextTitle: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.navy },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNumberText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, color: colors.white },
  stepText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  bold: { fontFamily: fonts.semibold, color: colors.textStrong },
  actions: { gap: 10 },
  action: { borderRadius: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
});
