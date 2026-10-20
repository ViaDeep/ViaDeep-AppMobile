import { Asset } from 'expo-asset';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { onnxRuntimeInstalled, sessionLoadTime, timedDetect, type StageTimes } from '@/inference/onnx-engine';
import { summarize, type LatencySummary } from '@/inference/latency-stats';
import { Button } from '@/ui/button';
import { SettingsSection } from '@/ui/settings';
import { BackHeader } from '@/ui/top-bar';

const SAMPLE = require('../../../../assets/images/benchmark-sample.jpg');

// Mismo protocolo que el benchmark nativo del Galaxy S23: 10 ejecuciones de calentamiento y 100 medidas.
const WARMUP = 10;
const RUNS = 100;

const STAGES: { key: keyof StageTimes; label: string }[] = [
  { key: 'pixels', label: 'Leer y redimensionar foto' },
  { key: 'tensor', label: 'Armar tensor' },
  { key: 'inference', label: 'Inferencia ONNX' },
  { key: 'postprocess', label: 'Posproceso' },
  { key: 'total', label: 'Total (end-to-end)' },
];

type Report = {
  device: string;
  android: string;
  image: string;
  warmup: number;
  runs: number;
  sessionLoadMs: number;
  detection: string;
  stages: Record<keyof StageTimes, LatencySummary>;
  rawTotalMs: number[];
};

const ms = (value: number) => value.toFixed(1);

export default function BenchmarkScreen() {
  const [image, setImage] = useState<{ uri: string; name: string } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) setImage({ uri: result.assets[0].uri, name: result.assets[0].fileName ?? 'foto de la galería' });
  }

  async function run() {
    setReport(null);
    setError(null);
    try {
      let source = image;
      if (!source) {
        const [asset] = await Asset.loadAsync(SAMPLE);
        source = { uri: asset.localUri ?? asset.uri, name: 'China_Drone_000001.jpg' };
      }
      setProgress('Cargando el modelo…');
      const sessionLoadMs = await sessionLoadTime();
      let detection = 'Sin detección';
      for (let i = 0; i < WARMUP; i++) {
        setProgress(`Calentamiento ${i + 1}/${WARMUP}`);
        await timedDetect(source.uri);
      }
      const samples: StageTimes[] = [];
      for (let i = 0; i < RUNS; i++) {
        setProgress(`Midiendo ${i + 1}/${RUNS}`);
        const { detection: found, times } = await timedDetect(source.uri);
        samples.push(times);
        if (found) detection = `${found.type} ${(found.confidence * 100).toFixed(1)} %`;
      }
      const stages = Object.fromEntries(STAGES.map(({ key }) => [key, summarize(samples.map((s) => s[key]))])) as Report['stages'];
      setReport({
        device: `${Device.manufacturer ?? ''} ${Device.modelName ?? ''}`.trim(),
        android: `${Device.osVersion ?? Platform.Version}`,
        image: source.name,
        warmup: WARMUP,
        runs: RUNS,
        sessionLoadMs,
        detection,
        stages,
        rawTotalMs: samples.map((s) => Number(s.total.toFixed(2))),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Rendimiento del modelo" step="LATENCIA ON-DEVICE" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>
          Ejecuta LMD-YOLO {WARMUP} veces para calentar y {RUNS} veces midiendo cada etapa, con el mismo camino que usa un
          reporte. Desconecta el cargador, cierra otras apps y no uses el celular mientras mide.
        </Text>

        {!onnxRuntimeInstalled ? (
          <Text style={styles.error}>Esta versión de la app no trae ONNX Runtime (Expo Go). Usa el APK de ViaDeep.</Text>
        ) : (
          <View style={styles.actions}>
            <Text style={styles.body}>Foto: {image?.name ?? 'China_Drone_000001.jpg (la del benchmark del Galaxy S23)'}</Text>
            <Button title="Usar otra foto" variant="outline" icon="photo-library" onPress={() => void pickImage()} disabled={progress != null} />
            <Button title={progress ?? `Medir (${WARMUP} + ${RUNS})`} icon="speed" onPress={() => void run()} loading={false} disabled={progress != null} />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {report ? (
          <>
            <SettingsSection title="RESULTADOS (MS)" footer={`${report.device} · Android ${report.android} · carga del modelo ${ms(report.sessionLoadMs)} ms · ${report.detection}`}>
              <View style={[styles.tableRow, styles.tableHead]}>
                <Text style={[styles.cell, styles.stageCell, styles.head]}>Etapa</Text>
                {['Media', 'P50', 'P95', 'Mín', 'Máx'].map((h) => (
                  <Text key={h} style={[styles.cell, styles.head]}>
                    {h}
                  </Text>
                ))}
              </View>
              {STAGES.map(({ key, label }) => {
                const s = report.stages[key];
                return (
                  <View key={key} style={styles.tableRow}>
                    <Text style={[styles.cell, styles.stageCell, key === 'total' && styles.bold]}>{label}</Text>
                    {[s.mean, s.p50, s.p95, s.min, s.max].map((v, i) => (
                      <Text key={i} style={[styles.cell, key === 'total' && styles.bold]}>
                        {ms(v)}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </SettingsSection>
            <Button
              title="Compartir resultados"
              variant="primary"
              icon="share"
              onPress={() => void Share.share({ message: JSON.stringify(report, null, 2) })}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: '#B91C1C' },
  actions: { gap: 10 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  tableHead: { borderTopWidth: 0 },
  cell: { width: 48, fontFamily: fonts.mono, fontSize: 11, color: colors.textStrong, textAlign: 'right' },
  stageCell: { flex: 1, width: undefined, fontFamily: fonts.regular, fontSize: 12, textAlign: 'left' },
  head: { fontFamily: fonts.monoBold, fontSize: 10, color: colors.textMuted },
  bold: { fontFamily: fonts.monoBold },
});
