import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { evidenceApi } from '@/api/evidence-api';
import { incidentApi } from '@/api/incident-api';
import { PhotoHud } from '@/components/photo-hud';
import { env } from '@/config/env';
import { colors, fonts } from '@/constants/theme';
import { dayAndClock, formatCoordinates, longDate } from '@/domain/display';
import { INCIDENT_TYPES, TYPE_LABELS, type IncidentType } from '@/domain/incident';
import { TYPE_ICONS } from '@/domain/type-icons';
import { useReportFlow } from '@/report-flow/report-flow';
import { useReports } from '@/reports/reports-context';
import { acceptedDetection, submitReport } from '@/services/report-service';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Icon } from '@/ui/icon';
import { BackHeader } from '@/ui/top-bar';

export default function ResultScreen() {
  const flow = useReportFlow();
  const { refresh } = useReports();
  const [sending, setSending] = useState(false);
  const { capture } = flow;

  if (!capture) {
    return <Redirect href="/report/camera" />;
  }

  // Solo cuenta como detección de IA si supera el umbral; si no, el ciudadano elige el tipo.
  const detection = acceptedDetection(flow.detection, env.aiConfidenceThreshold);
  const type: IncidentType | null = detection?.type ?? flow.manualType;
  const percent = detection ? (detection.confidence * 100).toFixed(1) : null;
  const place = capture.address ?? formatCoordinates(capture.coordinates.latitude, capture.coordinates.longitude);

  async function confirm() {
    if (!capture) return;
    setSending(true);
    try {
      const id = await submitReport(
        { ...capture, detection: flow.detection, manualType: flow.manualType, description: '' },
        {
          uploadEvidence: evidenceApi.upload,
          registerIncident: incidentApi.register,
          confidenceThreshold: env.aiConfidenceThreshold,
        },
      );
      flow.update({ submitted: { id, createdAt: new Date().toISOString() } });
      void refresh(true);
      // Se cierra el flujo de cámara para que "atrás" no vuelva a la foto ya enviada.
      router.dismissAll();
      router.push('/report/confirmation');
    } catch (e) {
      Alert.alert('No se pudo enviar', e instanceof Error ? e.message : 'Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <BackHeader
        centered
        title="Resultado del análisis"
        step="PASO 03 DE 04"
        right={
          detection ? (
            <Chip label="Listo" icon="task-alt" background="rgba(0,39,24,0.1)" border="rgba(78,222,163,0.3)" color={colors.success} />
          ) : (
            <Chip label="Manual" icon="touch-app" background={colors.warningSurface} border={colors.warningBorder} color={colors.warningText} />
          )
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <PhotoHud
          uri={capture.photoUri}
          height={208}
          address={place}
          time={dayAndClock(capture.capturedAt)}
          box={
            detection
              ? {
                  x: detection.bboxX,
                  y: detection.bboxY,
                  width: detection.bboxWidth,
                  height: detection.bboxHeight,
                  label: `${TYPE_LABELS[detection.type]} (${percent}%)`,
                }
              : null
          }
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardIcon}>
                <Icon name={detection ? 'policy' : 'touch-app'} size={16} color={colors.primary} />
              </View>
              <View style={styles.flexShrink}>
                <Text style={styles.cardTitle}>{detection ? 'Incidencia detectada' : 'Elige el tipo de daño'}</Text>
                <Text style={styles.cardSubtitle}>
                  {detection ? 'Revisión automática de calzada' : 'No hubo una detección automática confiable'}
                </Text>
              </View>
            </View>
            <View style={styles.modelChip}>
              <Text style={styles.modelChipText}>{detection ? 'LMD-YOLO' : 'MANUAL'}</Text>
            </View>
          </View>

          {detection ? (
            <View style={styles.tiles}>
              <View style={[styles.tile, styles.tileHalf]}>
                <Text style={styles.tileLabel}>Tipo de daño</Text>
                <View style={styles.tileValueRow}>
                  <Icon name={TYPE_ICONS[detection.type]} size={16} color={colors.text} />
                  <Text style={styles.tileValue}>{TYPE_LABELS[detection.type]}</Text>
                </View>
              </View>
              <SeverityTile half />
            </View>
          ) : (
            <>
              <View style={styles.options}>
                {INCIDENT_TYPES.map((option) => {
                  const selected = flow.manualType === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => flow.update({ manualType: option })}
                      style={[styles.option, selected && styles.optionSelected]}>
                      <Icon name={TYPE_ICONS[option]} size={18} color={selected ? colors.white : colors.primary} />
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{TYPE_LABELS[option]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <SeverityTile />
            </>
          )}

          {detection && percent ? (
            <View style={styles.confidence}>
              <View style={styles.confidenceRow}>
                <View style={styles.confidenceLabel}>
                  <Icon name="verified" size={14} color={colors.textSecondary} />
                  <Text style={styles.confidenceText}>Nivel de coincidencia</Text>
                </View>
                <View style={styles.confidenceValue}>
                  <Text style={styles.confidenceValueText}>
                    {percent}% {detection.confidence >= 0.8 ? '(Alta precisión)' : '(Precisión media)'}
                  </Text>
                </View>
              </View>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${Math.min(100, detection.confidence * 100)}%` }]} />
              </View>
            </View>
          ) : null}

          <View style={styles.meta}>
            <MetaRow icon="location-on" label="Ubicación validada por GPS" value={place} />
            <MetaRow icon="event" label="Fecha y registro" value={longDate(capture.capturedAt)} />
          </View>
        </View>

        <View style={styles.disclaimer}>
          <View style={styles.disclaimerIcon}>
            <Icon name="account-balance" size={15} color={colors.white} />
          </View>
          <View style={styles.flexShrink}>
            <Text style={styles.disclaimerTitle}>Municipalidad Metropolitana de Lima</Text>
            <Text style={styles.disclaimerText}>
              {detection
                ? 'Esta clasificación es generada automáticamente por el modelo de inteligencia artificial y será enviada junto con tu reporte para acelerar la inspección municipal.'
                : 'El tipo de daño que elijas se enviará con tu reporte y será verificado por el equipo técnico durante la inspección municipal.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button
          title="Confirmar reporte"
          variant="primary"
          icon="arrow-forward"
          iconPosition="right"
          onPress={confirm}
          loading={sending}
          disabled={!type}
        />
        <Button title="Tomar otra fotografía" variant="outline" size="sm" icon="photo-camera" onPress={() => router.dismissTo('/report/camera')} disabled={sending} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

/** La severidad la asigna la Municipalidad al revisar el reporte, no la app. */
function SeverityTile({ half = false }: { half?: boolean }) {
  return (
    <View style={[styles.tile, half && styles.tileHalf]}>
      <Text style={styles.tileLabel}>Nivel de severidad</Text>
      <View style={styles.severity}>
        <View style={styles.severityDot} />
        <Text style={styles.severityText}>Por evaluar</Text>
      </View>
    </View>
  );
}

function MetaRow({ icon, label, value }: { icon: 'location-on' | 'event'; label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Icon name={icon} size={14} color={colors.textSecondary} />
      <View style={styles.flexShrink}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.3)',
    borderRadius: 8,
    padding: 17,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBlue,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  cardIcon: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(0,87,192,0.1)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22.5, color: colors.text },
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  modelChip: { backgroundColor: colors.surfaceBlueSoft, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  modelChipText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: '#001A43' },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: {
    gap: 4,
    padding: 11,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.2)',
    backgroundColor: colors.surfaceMuted,
  },
  tileHalf: { flex: 1 },
  tileLabel: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  tileValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.text },
  severity: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSurface,
  },
  severityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  severityText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.warningText },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    width: '48%',
    flexGrow: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  optionSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  optionText: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, color: colors.text },
  optionTextSelected: { color: colors.white },
  confidence: {
    gap: 6,
    padding: 11,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.2)',
    backgroundColor: colors.surfaceMuted,
  },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  confidenceLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  confidenceValue: { backgroundColor: 'rgba(0,39,24,0.1)', borderRadius: 2, paddingHorizontal: 8, paddingVertical: 2, flexShrink: 1 },
  confidenceValueText: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 16, letterSpacing: 0.44, color: colors.success },
  bar: { height: 8, borderRadius: 12, backgroundColor: colors.surfaceBlue, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 12, backgroundColor: colors.success },
  meta: { gap: 8, paddingTop: 4 },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaLabel: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  metaValue: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.text },
  disclaimer: {
    flexDirection: 'row',
    gap: 12,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.3)',
    backgroundColor: colors.surfaceMuted,
  },
  disclaimerIcon: { width: 32, height: 32, borderRadius: 4, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  disclaimerTitle: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: colors.text },
  disclaimerText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19.5, color: colors.textSecondary, marginTop: 4 },
  footer: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(197,198,207,0.3)',
  },
});
