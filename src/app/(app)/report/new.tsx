import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { evidenceApi } from '@/api/evidence-api';
import { incidentApi } from '@/api/incident-api';
import { env } from '@/config/env';
import { colors, radius, spacing } from '@/constants/theme';
import { INCIDENT_TYPES, TYPE_LABELS, type IncidentType } from '@/domain/incident';
import { pendingInferenceEngine, type Detection } from '@/inference/inference-engine';
import { acceptedDetection, submitReport, type Coordinates } from '@/services/report-service';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';

const inference = pendingInferenceEngine;

type Capture = { photoUri: string; coordinates: Coordinates; detection: Detection | null };

export default function NewReportScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [processing, setProcessing] = useState(false);

  if (!permission) {
    return <ActivityIndicator style={styles.centered} size="large" color={colors.primary} />;
  }
  if (!permission.granted) {
    return (
      <View style={[styles.centered, styles.padded]}>
        <Text style={styles.message}>ViaDeep necesita la cámara para fotografiar el daño en la pista.</Text>
        <Button title="Permitir cámara" onPress={() => void requestPermission()} />
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current || processing) return;
    setProcessing(true);
    try {
      const coordinates = await currentCoordinates();
      if (!coordinates) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const detection = await inference.detect(photo.uri).catch(() => null);
      setCapture({ photoUri: photo.uri, coordinates, detection });
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  if (capture) {
    return <ReviewStep capture={capture} onRetake={() => setCapture(null)} />;
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={styles.flex} facing="back" />
      <View style={styles.cameraFooter}>
        <Text style={styles.hint}>Encuadra el daño de la pista y toma la foto.</Text>
        <Button title={processing ? 'Procesando…' : 'Tomar foto'} onPress={takePhoto} loading={processing} />
      </View>
    </View>
  );
}

/** Pide el permiso de ubicación y devuelve la posición actual, o null si el usuario no la concede. */
async function currentCoordinates(): Promise<Coordinates | null> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    Alert.alert('Ubicación requerida', 'Necesitamos tu ubicación para saber dónde está el daño.');
    return null;
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

function ReviewStep({ capture, onRetake }: { capture: Capture; onRetake: () => void }) {
  const detection = acceptedDetection(capture.detection, env.aiConfidenceThreshold);
  const [manualType, setManualType] = useState<IncidentType | null>(null);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      const id = await submitReport(
        { ...capture, manualType, description },
        {
          uploadEvidence: evidenceApi.upload,
          registerIncident: incidentApi.register,
          confidenceThreshold: env.aiConfidenceThreshold,
        },
      );
      Alert.alert('Reporte enviado', 'Gracias. La municipalidad revisará tu reporte.');
      router.replace(`/report/${id}`);
    } catch (e) {
      Alert.alert('No se pudo enviar', e instanceof Error ? e.message : 'Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.padded} keyboardShouldPersistTaps="handled">
      <Image source={{ uri: capture.photoUri }} style={styles.preview} />
      <Text style={styles.meta}>
        Ubicación: {capture.coordinates.latitude.toFixed(5)}, {capture.coordinates.longitude.toFixed(5)}
      </Text>

      {detection ? (
        <View style={styles.detection}>
          <Text style={styles.detectionTitle}>Daño detectado: {TYPE_LABELS[detection.type]}</Text>
          <Text style={styles.meta}>Confianza {(detection.confidence * 100).toFixed(0)} %</Text>
        </View>
      ) : (
        <View style={styles.typePicker}>
          <Text style={styles.label}>
            {inference.available
              ? 'No se detectó un daño con suficiente confianza. Elige el tipo:'
              : 'Elige el tipo de daño:'}
          </Text>
          {INCIDENT_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setManualType(type)}
              style={[styles.option, manualType === type && styles.optionSelected]}>
              <Text style={[styles.optionText, manualType === type && styles.optionTextSelected]}>
                {TYPE_LABELS[type]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <TextField
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
        maxLength={500}
        multiline
        style={styles.description}
        placeholder="Ej.: frente al paradero, ocupa todo el carril"
      />
      <Button title="Enviar reporte" onPress={send} loading={sending} disabled={!detection && !manualType} />
      <Button title="Tomar otra foto" variant="secondary" onPress={onRetake} disabled={sending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  padded: { padding: spacing.md, gap: spacing.md },
  message: { fontSize: 16, color: colors.text, textAlign: 'center' },
  cameraFooter: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surface },
  hint: { color: colors.textSecondary, textAlign: 'center' },
  preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md },
  meta: { color: colors.textSecondary },
  detection: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  detectionTitle: { fontSize: 16, fontWeight: '700', color: colors.success },
  typePicker: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { fontSize: 16, color: colors.text },
  optionTextSelected: { color: colors.primaryText, fontWeight: '600' },
  description: { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing.sm },
});
