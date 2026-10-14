import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { Icon } from '@/ui/icon';

export type HudBox = { x: number; y: number; width: number; height: number; label: string };

type Props = {
  uri: string | null;
  height: number;
  /** Etiqueta arriba a la derecha, por ejemplo "GPS ±2.5m". */
  badge?: string;
  address?: string | null;
  coordinates?: string;
  time?: string;
  /** Caja de la detección con coordenadas normalizadas a [0, 1] respecto a la foto original. */
  box?: HudBox | null;
  children?: ReactNode;
};

/** Foto con los datos superpuestos (ubicación, hora y caja de detección), como en los mockups. */
export function PhotoHud({ uri, height, badge, address, coordinates, time, box, children }: Props) {
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height: layoutHeight } = event.nativeEvent.layout;
    setFrame({ width, height: layoutHeight });
  }

  const boxStyle = box && frame && natural ? coverBox(box, frame, natural) : null;

  return (
    <View style={[styles.frame, { height }]} onLayout={onLayout}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onLoad={(event) => setNatural({ width: event.source.width, height: event.source.height })}
        />
      ) : (
        <View style={styles.placeholder}>
          <Icon name="image" size={32} color={colors.textMuted} />
          <Text style={styles.placeholderText}>Foto no disponible</Text>
        </View>
      )}

      {box && boxStyle ? (
        <View style={[styles.box, boxStyle]}>
          <View style={[styles.reticle, styles.reticleTL]} />
          <View style={[styles.reticle, styles.reticleTR]} />
          <View style={[styles.reticle, styles.reticleBL]} />
          <View style={[styles.reticle, styles.reticleBR]} />
          <View style={styles.boxLabel}>
            <View style={styles.boxDot} />
            <Text style={styles.boxLabelText} numberOfLines={1}>
              {box.label}
            </Text>
          </View>
        </View>
      ) : null}

      {badge ? (
        <View style={styles.badge}>
          <Icon name="my-location" size={11} color={colors.white} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      {children}

      {address || coordinates || time ? (
        <LinearGradient colors={['rgba(15,32,66,0)', 'rgba(15,32,66,0.85)', 'rgba(15,32,66,0.95)']} style={styles.hud}>
          <View style={styles.hudLeft}>
            {address ? (
              <View style={styles.hudRow}>
                <Icon name="location-on" size={12} color={colors.white} />
                <Text style={styles.hudAddress} numberOfLines={1}>
                  {address}
                </Text>
              </View>
            ) : null}
            {coordinates ? <Text style={[styles.hudCoordinates, address ? styles.hudIndent : null]}>{coordinates}</Text> : null}
          </View>
          {time ? (
            <View style={styles.hudRow}>
              <Icon name="schedule" size={11} color={colors.surfaceBlueStrong} />
              <Text style={styles.hudTime}>{time}</Text>
            </View>
          ) : null}
        </LinearGradient>
      ) : null}
    </View>
  );
}

/** Convierte la caja normalizada a píxeles de pantalla considerando el recorte de contentFit="cover". */
function coverBox(
  box: HudBox,
  frame: { width: number; height: number },
  natural: { width: number; height: number },
) {
  const scale = Math.max(frame.width / natural.width, frame.height / natural.height);
  const offsetX = (frame.width - natural.width * scale) / 2;
  const offsetY = (frame.height - natural.height * scale) / 2;
  return {
    left: offsetX + box.x * natural.width * scale,
    top: offsetY + box.y * natural.height * scale,
    width: box.width * natural.width * scale,
    height: box.height * natural.height * scale,
  };
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.borderFaint,
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  placeholderText: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  box: { position: 'absolute', borderWidth: 2, borderColor: colors.primary, borderRadius: 4, backgroundColor: 'rgba(0,87,192,0.08)' },
  reticle: { position: 'absolute', width: 10, height: 10, borderColor: colors.white },
  reticleTL: { left: -4, top: -4, borderLeftWidth: 2, borderTopWidth: 2 },
  reticleTR: { right: -4, top: -4, borderRightWidth: 2, borderTopWidth: 2 },
  reticleBL: { left: -4, bottom: -4, borderLeftWidth: 2, borderBottomWidth: 2 },
  reticleBR: { right: -4, bottom: -4, borderRightWidth: 2, borderBottomWidth: 2 },
  boxLabel: {
    position: 'absolute',
    left: -2,
    top: -26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: colors.navy,
  },
  boxDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.successSoft },
  boxLabelText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.white },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(15,32,66,0.85)',
  },
  badgeText: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.white },
  hud: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 25,
    paddingBottom: 10,
  },
  hudLeft: { flex: 1, gap: 2 },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hudAddress: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.white },
  hudCoordinates: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.border },
  hudIndent: { paddingLeft: 16 },
  hudTime: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.surfaceBlueStrong },
});
