import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { formatCoordinates } from '@/domain/display';
import { useReportFlow } from '@/report-flow/report-flow';
import { addressFor, locate, openLocationSettings, type DeviceLocation } from '@/services/location';
import { Button } from '@/ui/button';
import { Icon, type IconName } from '@/ui/icon';

type Flash = Exclude<FlashMode, 'screen'>;

const FLASH_ORDER: Flash[] = ['auto', 'on', 'off'];
const FLASH_ICONS: Record<Flash, IconName> = { auto: 'flash-auto', on: 'flash-on', off: 'flash-off' };

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const flow = useReportFlow();
  const [flash, setFlash] = useState<Flash>('auto');
  const [torch, setTorch] = useState(false);
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [locating, setLocating] = useState(true);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  /** Vuelve a buscar la ubicación (por ejemplo, al tocar la etiqueta de GPS). */
  async function refreshLocation() {
    setLocating(true);
    return lookUpLocation();
  }

  /** Busca la ubicación y la muestra en pantalla; devuelve el resultado para quien la pidió. */
  async function lookUpLocation() {
    try {
      const result = await locate();
      if (!mounted.current) return result;
      if (result.status === 'ok') {
        setLocation(result.location);
        const street = await addressFor(result.location.coordinates);
        if (mounted.current) setAddress(street);
      }
      return result;
    } finally {
      if (mounted.current) setLocating(false);
    }
  }

  // La ubicación se pide al abrir la cámara para mostrarla en pantalla antes de la foto.
  useEffect(() => {
    mounted.current = true;
    void lookUpLocation();
    return () => {
      mounted.current = false;
    };
  }, []);

  if (!permission) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.flex, styles.centered, styles.permission]}>
        <Icon name="photo-camera" size={40} color={colors.white} />
        <Text style={styles.permissionText}>ViaDeep necesita la cámara para fotografiar la incidencia en la vía.</Text>
        <Button title="Permitir cámara" variant="primary" onPress={() => void requestPermission()} style={styles.permissionButton} />
        <Button title="Volver" variant="outline" onPress={() => router.back()} style={styles.permissionButton} />
      </SafeAreaView>
    );
  }

  /**
   * Usa la ubicación ya obtenida o la vuelve a pedir. Si no se consigue, explica por qué y ofrece
   * activar el GPS (o dar el permiso) y reintentar la misma acción.
   */
  async function ensureLocation(retry: () => void): Promise<DeviceLocation | null> {
    if (location) return location;
    const result = await refreshLocation();
    if (result.status === 'ok') return result.location;
    const reason = result.status;
    Alert.alert(
      'No pudimos obtener tu ubicación',
      reason === 'denied'
        ? 'ViaDeep necesita permiso de ubicación para saber dónde está la incidencia. Actívalo en los ajustes y vuelve a intentarlo.'
        : 'Activa el GPS (ubicación) de tu celular y vuelve a intentarlo. Si estás en un lugar cerrado, acércate a una zona abierta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: reason === 'denied' ? 'Abrir ajustes' : 'Activar GPS', onPress: () => void openLocationSettings(reason) },
        { text: 'Reintentar', onPress: retry },
      ],
    );
    return null;
  }

  async function goToPreview(photoUri: string, found: DeviceLocation) {
    const street = address ?? (await addressFor(found.coordinates));
    flow.reset();
    flow.update({
      capture: {
        photoUri,
        coordinates: found.coordinates,
        accuracy: found.accuracy,
        address: street,
        capturedAt: new Date().toISOString(),
      },
    });
    router.push('/report/preview');
  }

  async function takePhoto() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const found = await ensureLocation(() => void takePhoto());
      if (!found) return;
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      await goToPreview(photo.uri, found);
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function pickFromGallery() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      if (result.canceled || !result.assets[0]) return;
      await continueWithPhoto(result.assets[0].uri);
    } finally {
      setBusy(false);
    }
  }

  /** Se registra la ubicación actual del ciudadano, que debe estar junto a la incidencia. */
  async function continueWithPhoto(photoUri: string) {
    const found = await ensureLocation(() => void continueWithPhoto(photoUri));
    if (found) await goToPreview(photoUri, found);
  }

  function nextFlash() {
    setFlash((current) => FLASH_ORDER[(FLASH_ORDER.indexOf(current) + 1) % FLASH_ORDER.length]);
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} enableTorch={torch} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,9,34,0.8)', 'rgba(0,9,34,0)', 'rgba(0,9,34,0.95)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.headerButton}>
              <Icon name="arrow-back" size={20} color={colors.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Registrar incidencia</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable accessibilityRole="button" accessibilityLabel="Cambiar flash" onPress={nextFlash} style={styles.flashButton}>
              <Icon name={FLASH_ICONS[flash]} size={18} color={colors.white} />
            </Pressable>
            <View style={styles.camChip}>
              <View style={styles.camDot} />
              <Text style={styles.camText}>CAM 01</Text>
            </View>
          </View>
        </View>

        <View style={styles.viewfinder}>
          <View style={styles.gps}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver a buscar la ubicación"
              disabled={locating || location !== null}
              onPress={() => void refreshLocation()}
              style={styles.gpsPill}>
              {locating ? (
                <ActivityIndicator size="small" color={colors.successSoft} />
              ) : (
                <Icon name={location ? 'my-location' : 'location-disabled'} size={15} color={colors.successSoft} />
              )}
              <Text style={styles.gpsText}>
                {locating ? 'Buscando ubicación…' : location ? 'Ubicación detectada' : 'Ubicación no disponible · Toca para reintentar'}
              </Text>
              {location?.accuracy ? (
                <>
                  <View style={styles.gpsDivider} />
                  <Text style={styles.gpsAccuracy}>±{location.accuracy.toFixed(1)}m</Text>
                </>
              ) : null}
            </Pressable>
            {location ? (
              <View style={styles.ribbon}>
                <Text style={styles.ribbonText} numberOfLines={1}>
                  {formatCoordinates(location.coordinates.latitude, location.coordinates.longitude)}{' '}
                  {address ? <Text style={styles.ribbonStreet}>({address})</Text> : null}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.frame} pointerEvents="none">
            <View style={styles.grid}>
              <View style={[styles.gridLine, styles.gridV1]} />
              <View style={[styles.gridLine, styles.gridV2]} />
              <View style={[styles.gridLine, styles.gridH1]} />
              <View style={[styles.gridLine, styles.gridH2]} />
            </View>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <View style={styles.level}>
              <View style={styles.levelLine} />
              <View style={styles.levelDot}>
                <View style={styles.levelDotInner} />
              </View>
              <View style={styles.levelLine} />
            </View>
          </View>

          <View style={styles.tip}>
            <Icon name="center-focus-weak" size={12} color="#E2E8F0" />
            <Text style={styles.tipText}>Encuadra el bache o deterioro en el centro</Text>
          </View>
        </View>

        <LinearGradient colors={['rgba(15,32,66,0.95)', colors.navy, colors.text]} style={styles.sheet}>
          <View style={styles.safety}>
            <Icon name="warning" size={16} color={colors.danger} />
            <Text style={styles.safetyText}>Ubícate a una distancia segura de la incidencia antes de tomar la fotografía.</Text>
          </View>
          <View style={styles.controls}>
            <Pressable accessibilityRole="button" onPress={pickFromGallery} style={styles.sideButton}>
              <Icon name="photo-library" size={20} color={colors.white} />
              <Text style={styles.sideLabel}>Galería</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Tomar fotografía" onPress={takePhoto} disabled={busy} style={styles.shutterRing}>
              <View style={styles.shutter}>
                {busy ? <ActivityIndicator color={colors.primary} /> : <Icon name="photo-camera" size={28} color={colors.primary} />}
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: torch }}
              onPress={() => setTorch((value) => !value)}
              style={[styles.sideButton, torch && styles.sideButtonActive]}>
              <Icon name="flashlight-on" size={20} color={colors.white} />
              <Text style={styles.sideLabel}>Linterna</Text>
            </Pressable>
          </View>
          <Text style={styles.captureLabel}>PRESIONA PARA CAPTURAR EVIDENCIA</Text>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

const CORNER = 24;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  centered: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  permission: { padding: 24, gap: 16 },
  permissionText: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, color: colors.white, textAlign: 'center' },
  permissionButton: { alignSelf: 'stretch' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(15,32,66,0.82)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(117,119,127,0.2)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.45, color: colors.white },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flashButton: {
    width: 36,
    height: 36,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(117,119,127,0.3)',
    backgroundColor: 'rgba(15,32,66,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(78,222,163,0.4)',
    backgroundColor: 'rgba(0,39,24,0.9)',
  },
  camDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.successSoft },
  camText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.successSoft },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  gps: { alignItems: 'center', gap: 4, maxWidth: 340 },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78,222,163,0.4)',
    backgroundColor: 'rgba(15,32,66,0.82)',
  },
  gpsText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: -0.25, color: colors.white },
  gpsDivider: { width: 4, height: 12, backgroundColor: 'rgba(117,119,127,0.4)' },
  gpsAccuracy: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.surfaceBlueSoft },
  ribbon: {
    paddingHorizontal: 13,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(117,119,127,0.3)',
    backgroundColor: 'rgba(15,32,66,0.85)',
    maxWidth: 340,
  },
  ribbonText: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.white, textAlign: 'center' },
  ribbonStreet: { fontFamily: fonts.mono, color: colors.surfaceBlueSoft },
  frame: { width: 256, height: 256, alignItems: 'center', justifyContent: 'center' },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.15)' },
  gridV1: { left: '33.3%', top: 0, bottom: 0, width: 1 },
  gridV2: { left: '66.6%', top: 0, bottom: 0, width: 1 },
  gridH1: { top: '33.3%', left: 0, right: 0, height: 1 },
  gridH2: { top: '66.6%', left: 0, right: 0, height: 1 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary },
  cornerTL: { top: -4, left: -4, borderLeftWidth: 2, borderTopWidth: 2, borderTopLeftRadius: 2 },
  cornerTR: { top: -4, right: -4, borderRightWidth: 2, borderTopWidth: 2, borderTopRightRadius: 2 },
  cornerBL: { bottom: -4, left: -4, borderLeftWidth: 2, borderBottomWidth: 2, borderBottomLeftRadius: 2 },
  cornerBR: { bottom: -4, right: -4, borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: 2 },
  level: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    opacity: 0.8,
  },
  levelLine: { width: 32, height: 2, backgroundColor: colors.successSoft },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDotInner: { width: 2, height: 2, borderRadius: 1, backgroundColor: colors.successSoft },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(117,119,127,0.3)',
    backgroundColor: 'rgba(0,9,34,0.7)',
  },
  tipText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: '#E2E8F0' },
  sheet: { paddingHorizontal: 16, paddingTop: 13, paddingBottom: 24, borderTopWidth: 1, borderTopColor: 'rgba(117,119,127,0.3)' },
  safety: {
    flexDirection: 'row',
    gap: 8,
    padding: 11,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.5)',
    backgroundColor: 'rgba(255,218,214,0.2)',
  },
  safetyText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.white },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 16 },
  sideButton: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(117,119,127,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sideButtonActive: { backgroundColor: 'rgba(0,111,240,0.45)', borderColor: colors.primaryBright },
  sideLabel: { fontFamily: fonts.monoBold, fontSize: 9, lineHeight: 10, letterSpacing: 0.54, color: '#CBD5E1' },
  shutterRing: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(216,226,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primaryBright,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureLabel: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.1,
    color: '#CBD5E1',
    textAlign: 'center',
    paddingTop: 20,
  },
});
