import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoHud } from '@/components/photo-hud';
import { colors, fonts } from '@/constants/theme';
import { dayAndClock, formatCoordinates } from '@/domain/display';
import { inferenceEngine } from '@/inference/engine';
import { useReportFlow } from '@/report-flow/report-flow';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Icon } from '@/ui/icon';
import { BackHeader } from '@/ui/top-bar';

const CHECKS = ['Enfoque nítido', 'Luz adecuada'] as const;

export default function PreviewScreen() {
  const flow = useReportFlow();
  const { capture } = flow;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [analyzing, setAnalyzing] = useState(false);

  if (!capture) {
    return <Redirect href="/report/camera" />;
  }

  async function continueToResult() {
    if (!capture) return;
    setAnalyzing(true);
    try {
      const detection = inferenceEngine.available ? await inferenceEngine.detect(capture.photoUri).catch(() => null) : null;
      flow.update({ detection, manualType: null });
      router.push('/report/result');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader
        title="Vista previa"
        step="PASO 02 DE 04"
        right={
          <Chip label="Evidencia capturada" dot={colors.primary} shape="tag" background={colors.surfaceBlueStrong} border="rgba(0,87,192,0.2)" color={colors.primary} />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <PhotoHud
            uri={capture.photoUri}
            height={265}
            badge={capture.accuracy ? `GPS ±${capture.accuracy.toFixed(1)}m` : 'GPS'}
            address={capture.address}
            coordinates={formatCoordinates(capture.coordinates.latitude, capture.coordinates.longitude)}
            time={dayAndClock(capture.capturedAt)}
          />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Icon name="image-search" size={15} color={colors.primary} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>¿La fotografía muestra claramente la incidencia?</Text>
                <Text style={styles.cardBody}>
                  Asegúrate de que el bache o falla en la pista sea reconocible y no esté borroso antes de enviar tu reporte municipal.
                </Text>
              </View>
            </View>
            <View style={styles.checks}>
              {CHECKS.map((label) => {
                const on = checked[label] ?? false;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() => setChecked((current) => ({ ...current, [label]: !on }))}
                    style={styles.check}>
                    <Icon name={on ? 'check-circle' : 'radio-button-unchecked'} size={15} color={on ? colors.success : colors.textMuted} />
                    <Text style={styles.checkText}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.actions}>
            <Button title="Volver a tomar" variant="outline" icon="refresh" onPress={() => router.back()} style={styles.action} />
            <Button
              title="Continuar"
              variant="primary"
              icon="arrow-forward"
              iconPosition="right"
              onPress={continueToResult}
              loading={analyzing}
              style={styles.action}
            />
          </View>
          <View style={styles.note}>
            <View style={styles.noteRow}>
              <Icon name="memory" size={12} color={colors.primary} />
              <Text style={styles.noteStrong}>
                {inferenceEngine.available
                  ? 'Al continuar, la imagen será analizada localmente mediante inteligencia artificial.'
                  : 'El modelo de IA aún no está instalado en la app: en el siguiente paso eliges el tipo de daño.'}
              </Text>
            </View>
            <View style={styles.noteRow}>
              <Icon name="verified-user" size={11} color={colors.success} />
              <Text style={styles.noteText}>Procesamiento on-device seguro · Municipalidad de Lima</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'space-between', padding: 16, gap: 16 },
  top: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.8)',
    borderRadius: 8,
    padding: 13,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 10 },
  cardIcon: { width: 28, height: 28, borderRadius: 4, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, color: colors.text },
  cardBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  checks: { flexDirection: 'row', gap: 8, paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.surfaceBlue },
  check: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkText: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  footer: { gap: 12, paddingTop: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, borderRadius: 4 },
  note: {
    gap: 6,
    padding: 11,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBlue,
    backgroundColor: 'rgba(239,244,255,0.7)',
  },
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  noteStrong: { flexShrink: 1, fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.4, color: colors.textStrong, textAlign: 'center' },
  noteText: { flexShrink: 1, fontFamily: fonts.mono, fontSize: 10, lineHeight: 15, color: colors.textSecondary, textAlign: 'center' },
});
