import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { incidentApi } from '@/api/incident-api';
import { PhotoHud } from '@/components/photo-hud';
import { placeLabel } from '@/components/report-cards';
import { colors, fonts } from '@/constants/theme';
import { citizenStatus, formatDateTime, relativeTime, reportCode, statusPhase, type CitizenStatus } from '@/domain/display';
import { SEVERITY_LABELS, TYPE_LABELS, type IncidentDetail, type IncidentStatus } from '@/domain/incident';
import { TYPE_ICONS } from '@/domain/type-icons';
import { useEvidenceUrl } from '@/reports/use-evidence-url';
import { addressFor } from '@/services/location';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { comingSoon } from '@/ui/coming-soon';
import { DamageHelpButton } from '@/ui/damage-help';
import { Icon } from '@/ui/icon';
import { StatusBadge } from '@/ui/status-badge';
import { BackHeader } from '@/ui/top-bar';

type Phase = { title: string; description: string; at: string | null };

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photo = useEvidenceUrl(incident?.evidenceId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await incidentApi.detail(id);
        if (cancelled) return;
        setIncident(detail);
        // El backend guarda solo coordenadas y distrito; la calle se obtiene en el celular.
        const street = await addressFor({ latitude: detail.latitude, longitude: detail.longitude });
        if (!cancelled) setAddress(street);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el reporte.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const code = incident ? reportCode(incident.id, incident.createdAt) : '';

  function backToList() {
    if (router.canGoBack()) router.back();
    else router.replace('/reports');
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackHeader title="Detalle del reporte" onBack={backToList} />
        <View style={styles.centered}>
          {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator size="large" color={colors.primary} />}
        </View>
      </SafeAreaView>
    );
  }

  const status = citizenStatus(incident.status, incident.severity);
  const phase = statusPhase(status);
  const ai = incident.aiValidated ? incident.aiResult : null;
  const place = address ?? placeLabel(incident);
  const lastEntry = incident.history[incident.history.length - 1];

  async function share() {
    if (!incident) return;
    await Share.share({
      message: `Reporte ${code} en ViaDeep: ${TYPE_LABELS[incident.type]} en ${place}. Estado: ${status === 'RESOLVED' ? 'resuelto' : 'en seguimiento'}. https://maps.google.com/?q=${incident.latitude},${incident.longitude}`,
    });
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <BackHeader title="Detalle del reporte" onBack={backToList} right={<Chip label={code} dot={colors.primary} shape="tag" background={colors.surfaceBlue} border={colors.border} color={colors.text} />} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <PhotoHud
            uri={photo}
            height={176}
            box={
              ai
                ? {
                    x: ai.bboxX,
                    y: ai.bboxY,
                    width: ai.bboxWidth,
                    height: ai.bboxHeight,
                    label: `${TYPE_LABELS[incident.type].toUpperCase()} ${ai.confidence.toFixed(3)}`,
                  }
                : null
            }>
            <View style={styles.hudTop}>
              <View style={styles.hudChip}>
                <Icon name="visibility" size={11} color={colors.white} />
                <Text style={styles.hudChipText}>ViaDeep Vision Engine</Text>
              </View>
              {ai ? (
                <View style={styles.hudChip}>
                  <View style={styles.hudDot} />
                  <Text style={[styles.hudChipText, styles.hudChipGreen]}>{(ai.confidence * 100).toFixed(1)}% precisión</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.hudBottom}>
              <Text style={styles.hudCoords}>
                LAT: {incident.latitude.toFixed(4)} · LNG: {incident.longitude.toFixed(4)}
              </Text>
              <Text style={styles.hudZone}>{(incident.district ?? 'Lima Metro').toUpperCase()}</Text>
            </View>
          </PhotoHud>

          <View style={styles.metaTop}>
            <View style={styles.typeRow}>
              <View style={styles.typeIcon}>
                <Icon name={TYPE_ICONS[incident.type]} size={18} color={colors.primary} />
              </View>
              <View style={styles.flexShrink}>
                <Text style={styles.eyebrow}>TIPO DE DAÑO</Text>
                <View style={styles.typeTextRow}>
                  <Text style={styles.typeText}>{TYPE_LABELS[incident.type]}</Text>
                  <DamageHelpButton type={incident.type} />
                </View>
              </View>
            </View>
            <StatusBadge status={status} />
          </View>

          <View style={styles.metaBlock}>
            <View style={styles.addressRow}>
              <Icon name="location-on" size={15} color={colors.textSecondary} />
              <View style={styles.flexShrink}>
                <Text style={styles.address}>{place}</Text>
                {address || incident.district ? (
                  <Text style={styles.addressSub}>
                    {address && incident.district ? `${incident.district} · ` : ''}
                    {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                  </Text>
                ) : null}
                {incident.description ? <Text style={styles.description}>{incident.description}</Text> : null}
              </View>
            </View>
            <View style={styles.dateRow}>
              <View style={styles.inline}>
                <Icon name="schedule" size={14} color={colors.textSecondary} />
                <Text style={styles.date}>{formatDateTime(incident.createdAt)}</Text>
              </View>
              {incident.aiValidated ? (
                <View style={styles.inline}>
                  <Icon name="verified" size={14} color={colors.success} />
                  <Text style={styles.validated}>Validado por NPU</Text>
                </View>
              ) : (
                <View style={styles.inline}>
                  <Icon name="touch-app" size={14} color={colors.textMuted} />
                  <Text style={styles.manual}>Registro manual</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.stateHeader}>
            <Text style={styles.sectionTitle}>Estado del reporte</Text>
            <View style={styles.phaseChip}>
              <Text style={styles.phaseChipText}>Fase {phase} de 4</Text>
            </View>
          </View>

          <View style={styles.stepper}>
            {phasesFor(incident, status).map((item, index) => (
              <StepItem key={item.title} item={item} index={index + 1} phase={phase} rejected={status === 'REJECTED'} />
            ))}
          </View>

          <View style={styles.update}>
            <View style={styles.updateHeader}>
              <View style={styles.inline}>
                <Icon name="update" size={14} color={colors.text} />
                <Text style={styles.updateTitle}>Última actualización</Text>
              </View>
              <Text style={styles.updateTime}>{relativeTime(incident.updatedAt)}</Text>
            </View>
            <Text style={styles.updateLead}>{UPDATE_LEADS[status]}</Text>
            {lastEntry?.comment ? <Text style={styles.updateText}>{lastEntry.comment}</Text> : null}
            {incident.severity ? (
              <Text style={styles.updateText}>Severidad asignada: {SEVERITY_LABELS[incident.severity]}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.readOnly}>
          <Icon name="lock-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.readOnlyText}>
            Este reporte es de solo lectura. La actualización técnica la realiza el centro de operaciones de la Municipalidad.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button title="Volver a mis reportes" icon="arrow-back" onPress={backToList} style={styles.footerMain} />
        <View style={styles.footerRow}>
          <Button title="Compartir incidencia" variant="outline" size="sm" icon="share" onPress={share} style={styles.footerSmall} />
          <Button title="Constancia digital" variant="outline" size="sm" icon="description" onPress={() => comingSoon('Constancia digital')} style={styles.footerSmall} />
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const UPDATE_LEADS: Record<CitizenStatus, string> = {
  REGISTERED: 'Tu reporte fue recibido y espera la revisión del equipo técnico.',
  IN_REVIEW: 'El equipo técnico está verificando la severidad y prioridad de la incidencia.',
  IN_PROGRESS: 'Cuadrilla/área municipal asignada para la atención de la incidencia.',
  RESOLVED: 'La incidencia fue atendida y el reporte se cerró.',
  REJECTED: 'La Municipalidad rechazó el reporte tras revisarlo.',
};

function changedAt(incident: IncidentDetail, status: IncidentStatus): string | null {
  const entry = [...incident.history].reverse().find((item) => item.toStatus === status);
  return entry?.changedAt ?? null;
}

function phasesFor(incident: IncidentDetail, status: CitizenStatus): Phase[] {
  const registered = { title: 'Registrada', description: 'Captura telemática e inferencia geoespacial completada.', at: incident.createdAt };
  if (status === 'REJECTED') {
    return [registered, { title: 'Rechazado', description: 'El reporte no procede tras la revisión técnica.', at: changedAt(incident, 'REJECTED') }];
  }
  return [
    registered,
    { title: 'En revisión', description: 'Verificación técnica de severidad y prioridad municipal.', at: null },
    { title: 'En proceso', description: 'Cuadrilla vial despachada y en traslado hacia el punto.', at: changedAt(incident, 'IN_PROGRESS') },
    { title: 'Resuelta', description: 'Bacheo y compactación asfáltica finalizada con conformidad.', at: changedAt(incident, 'RESOLVED') },
  ];
}

function clock(iso: string): string {
  return formatDateTime(iso).split(' · ')[1];
}

function StepItem({ item, index, phase, rejected }: { item: Phase; index: number; phase: number; rejected: boolean }) {
  const done = index < phase || (index === phase && index === 4);
  const current = index === phase && !done;
  const right = item.at ? clock(item.at) : done ? 'Completada' : current ? '' : 'Pendiente';
  const accent = rejected && current ? colors.danger : colors.primary;
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepMarker,
          done && { backgroundColor: colors.primary },
          current && [styles.stepCurrent, { backgroundColor: accent }],
          !done && !current && styles.stepPending,
        ]}>
        {done ? <Icon name="check" size={12} color={colors.white} /> : null}
        {current ? <View style={styles.stepCurrentDot} /> : null}
        {!done && !current ? <View style={styles.stepPendingDot} /> : null}
      </View>
      <View style={styles.stepBody}>
        <View style={styles.stepTitleRow}>
          <Text style={[styles.stepTitle, current && { fontFamily: fonts.bold, color: accent }, !done && !current && styles.stepMuted]}>
            {item.title}
          </Text>
          {current ? (
            <View style={styles.activeChip}>
              <Text style={[styles.activeChipText, { color: accent }]}>Activo</Text>
            </View>
          ) : (
            <Text style={[styles.stepTime, !done && styles.stepMuted]}>{right}</Text>
          )}
        </View>
        <Text style={[styles.stepText, current && styles.stepTextCurrent, !done && !current && styles.stepMuted]}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, textAlign: 'center' },
  flexShrink: { flexShrink: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 13, gap: 12 },
  hudTop: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between' },
  hudChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    backgroundColor: 'rgba(15,32,66,0.9)',
  },
  hudDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.successBright },
  hudChipText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.white },
  hudChipGreen: { color: colors.successBright },
  hudBottom: { position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  hudCoords: {
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 13.5,
    color: '#B6C6F1',
    backgroundColor: 'rgba(15,32,66,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  hudZone: {
    flexShrink: 1,
    fontFamily: fonts.mono,
    fontSize: 9,
    lineHeight: 13.5,
    color: colors.white,
    backgroundColor: 'rgba(15,32,66,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  metaTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textSecondary },
  typeTextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  metaBlock: { gap: 8, paddingTop: 5, borderTopWidth: 1, borderTopColor: colors.border },
  addressRow: { flexDirection: 'row', gap: 8 },
  address: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textStrong },
  addressSub: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary, marginTop: 4 },
  description: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textSecondary, marginTop: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 },
  date: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  validated: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.success },
  manual: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textMuted },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  phaseChip: { backgroundColor: colors.surfaceBlue, borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2 },
  phaseChipText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.primary },
  stepper: { borderLeftWidth: 2, borderLeftColor: colors.surfaceBlue, marginLeft: 10, paddingLeft: 22, gap: 16 },
  step: { flexDirection: 'row' },
  stepMarker: {
    position: 'absolute',
    left: -33,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCurrent: { shadowColor: colors.primaryBright, shadowOpacity: 0.4, shadowRadius: 4, elevation: 2 },
  stepCurrentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  stepPending: { backgroundColor: colors.surfaceBlue, borderWidth: 1, borderColor: colors.border },
  stepPendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  stepBody: { flex: 1, gap: 2 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  stepTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.text },
  stepTime: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  stepText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  stepTextCurrent: { fontFamily: fonts.medium, color: colors.textStrong },
  stepMuted: { color: colors.textMuted },
  activeChip: { backgroundColor: colors.surfaceBlue, borderRadius: 2, paddingHorizontal: 6 },
  activeChipText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6 },
  update: {
    gap: 5,
    padding: 13,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  updateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  updateTitle: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: colors.text },
  updateTime: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  updateLead: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16.5, color: colors.textStrong },
  updateText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19.5, color: colors.textSecondary },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceBlue,
  },
  readOnlyText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.textSecondary },
  footer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'rgba(248,249,255,0.95)',
  },
  footerMain: { height: 44, borderRadius: 4 },
  footerRow: { flexDirection: 'row', gap: 8 },
  footerSmall: { flex: 1, height: 36, borderRadius: 4, paddingHorizontal: 8 },
});
