import { Asset } from 'expo-asset';
import * as Device from 'expo-device';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { formatClock, runContinuousTest, type ContinuousProgress } from '@/inference/continuous-runner';
import { readContinuousLog, writeContinuousLog } from '@/inference/continuous-storage';
import { elapsedMs, minuteSummaries, summarizeContinuous, type ContinuousLog } from '@/inference/continuous-test';
import { onnxRuntimeInstalled, sessionLoadTime, timedDetect } from '@/inference/onnx-engine';
import { Button } from '@/ui/button';
import { SettingsSection } from '@/ui/settings';
import { BackHeader } from '@/ui/top-bar';

import DeviceStats from '../../../../modules/image-tensor/device-stats';

const SAMPLE = require('../../../../assets/images/benchmark-sample.jpg');

const DURATIONS = [15, 30];

const ms = (value: number | null | undefined) => (value == null ? '—' : value.toFixed(1));
const clock = formatClock;

/** Datos para el paper: resumen, minuto a minuto y fallas. Las detecciones una por una se quedan en el celular. */
function shareable(log: ContinuousLog) {
  const { runs, samples, ...info } = log;
  return {
    ...info,
    summary: summarizeContinuous(log),
    minutes: minuteSummaries(log),
    deviceSamples: samples,
    detections: runs.length,
  };
}

export default function ContinuousTestScreen() {
  const [previous, setPrevious] = useState<ContinuousLog | null>(null);
  const [live, setLive] = useState<ContinuousProgress | null>(null);
  const [result, setResult] = useState<ContinuousLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = live != null;
  const stop = useRef(false);
  const background = useRef(0);

  useEffect(() => {
    void readContinuousLog().then(setPrevious);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') background.current += 1;
    });
    return () => {
      subscription.remove();
      stop.current = true;
      void DeviceStats?.setKeepScreenOn(false).catch(() => undefined);
    };
  }, []);

  async function run(minutes: number) {
    if (!DeviceStats) return;
    setError(null);
    setResult(null);
    stop.current = false;
    background.current = 0;
    setLive({ elapsedMs: 0, runs: 0, failed: 0, lastTotalMs: null, pssMb: null, batteryTempC: null });
    try {
      const [asset] = await Asset.loadAsync(SAMPLE);
      const uri = asset.localUri ?? asset.uri;
      await sessionLoadTime();
      // Una detección antes de empezar, para que la carga del modelo no cuente en el primer minuto.
      const first = await timedDetect(uri);
      await DeviceStats.setKeepScreenOn(true);
      const startedAt = new Date().toISOString();
      const log: ContinuousLog = {
        version: 1,
        status: 'running',
        device: `${Device.manufacturer ?? ''} ${Device.modelName ?? ''}`.trim(),
        android: `${Device.osVersion ?? Platform.Version}`,
        image: 'China_Drone_000001.jpg',
        preprocessing: first.native ? 'nativo' : 'js',
        plannedMinutes: minutes,
        startedAt,
        updatedAt: startedAt,
        backgroundCount: 0,
        runs: [],
        samples: [],
        errors: [],
      };
      const done = await runContinuousTest({
        log,
        detect: () => timedDetect(uri),
        snapshot: () => DeviceStats!.snapshot(),
        save: writeContinuousLog,
        shouldStop: () => stop.current,
        backgroundCount: () => background.current,
        onProgress: setLive,
      });
      setResult(done);
      setPrevious(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLive(null);
      void DeviceStats.setKeepScreenOn(false).catch(() => undefined);
    }
  }

  const interrupted = previous?.status === 'running' ? previous : null;
  const shown = result ?? (previous && previous.status !== 'running' ? previous : null);

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Prueba de uso continuo" step="ESTABILIDAD ON-DEVICE" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.body}>
          Detecta daños una foto tras otra durante el tiempo elegido, con el mismo camino que un reporte. Cada 30 s
          anota la memoria de la app, la temperatura de la batería y el estado térmico, y cada minuto guarda el avance:
          si la app se cierra, al volver aquí verás cuándo pasó. Desconecta el cargador, cierra otras apps y deja el
          celular quieto en esta pantalla hasta que termine.
        </Text>

        {!onnxRuntimeInstalled || !DeviceStats ? (
          <Text style={styles.error}>Esta versión de la app no trae la prueba de uso continuo. Instala el APK nuevo de ViaDeep.</Text>
        ) : running ? (
          <SettingsSection title="EN CURSO">
            <View style={styles.liveBox}>
              <Text style={styles.liveClock}>{clock(live.elapsedMs)}</Text>
              <Text style={styles.body}>
                {live.runs} detecciones · {live.failed} fallidas · última {ms(live.lastTotalMs)} ms
              </Text>
              <Text style={styles.body}>
                Memoria {ms(live.pssMb)} MB · batería {live.batteryTempC == null ? '—' : `${live.batteryTempC.toFixed(1)} °C`}
              </Text>
              <Button title="Detener" variant="outline" icon="stop" onPress={() => (stop.current = true)} />
            </View>
          </SettingsSection>
        ) : (
          <View style={styles.actions}>
            {DURATIONS.map((minutes) => (
              <Button key={minutes} title={`Iniciar ${minutes} minutos`} icon="timer" onPress={() => void run(minutes)} />
            ))}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {interrupted && !running ? (
          <>
            <Text style={styles.error}>
              La prueba anterior se interrumpió a los {clock(elapsedMs(interrupted))} de {interrupted.plannedMinutes} min (último
              guardado {new Date(interrupted.updatedAt).toLocaleTimeString()}): la app se cerró o el celular la detuvo.
            </Text>
            <Report log={interrupted} />
          </>
        ) : null}

        {shown && !running ? <Report log={shown} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Report({ log }: { log: ContinuousLog }) {
  const s = summarizeContinuous(log);
  const rows: [string, string][] = [
    ['Duración', `${s.elapsedMinutes} de ${log.plannedMinutes} min`],
    ['Detecciones', `${s.runs} (${s.failed} fallidas)`],
    ['Total media / p95', `${ms(s.totalMs?.mean)} / ${ms(s.totalMs?.p95)} ms`],
    ['Inferencia media / p95', `${ms(s.inferenceMs?.mean)} / ${ms(s.inferenceMs?.p95)} ms`],
    ['Primer → último minuto', `${ms(s.firstMinuteMeanMs)} → ${ms(s.lastMinuteMeanMs)} ms (${s.latencyChangePercent ?? '—'} %)`],
    ['Memoria inicio / máx / fin', `${ms(s.pssStartMb)} / ${ms(s.pssMaxMb)} / ${ms(s.pssEndMb)} MB`],
    ['Batería inicio / máx / fin', `${ms(s.batteryTempStartC)} / ${ms(s.batteryTempMaxC)} / ${ms(s.batteryTempEndC)} °C`],
    ['Estado térmico máx', s.thermalStatusMax == null ? 'no disponible' : `${s.thermalStatusMax} (0 = normal)`],
    ['Carga de batería', `${ms(s.batteryStartPercent)} → ${ms(s.batteryEndPercent)} %`],
    ['Veces en segundo plano', `${log.backgroundCount}`],
  ];
  return (
    <>
      <SettingsSection
        title={log.status === 'running' ? 'HASTA EL CIERRE' : log.status === 'stopped' ? 'RESULTADOS (DETENIDA)' : 'RESULTADOS'}
        footer={`${log.device} · Android ${log.android} · foto preparada en ${log.preprocessing === 'nativo' ? 'Kotlin' : 'JavaScript'} · ${new Date(log.startedAt).toLocaleString()}`}
      >
        {rows.map(([label, value], i) => (
          <View key={label} style={[styles.row, i === 0 && styles.firstRow]}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </SettingsSection>
      {log.errors.length ? <Text style={styles.error}>{log.errors.join('\n')}</Text> : null}
      <Button
        title="Compartir resultados"
        variant="primary"
        icon="share"
        onPress={() => void Share.share({ message: JSON.stringify(shareable(log), null, 2) })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  error: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: '#B91C1C' },
  actions: { gap: 10 },
  liveBox: { padding: 16, gap: 8 },
  liveClock: { fontFamily: fonts.monoBold, fontSize: 32, color: colors.textStrong },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  firstRow: { borderTopWidth: 0 },
  label: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.textStrong },
  value: { fontFamily: fonts.mono, fontSize: 11, color: colors.textStrong, textAlign: 'right' },
});
