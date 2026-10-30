import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { colors, fonts } from '@/constants/theme';
import { DAMAGE_DRAWINGS, DRAWING_SIZE, ROAD } from '@/domain/damage-drawing';
import { DAMAGE_INFO } from '@/domain/damage-info';
import { TYPE_LABELS, type IncidentType } from '@/domain/incident';

import { Button } from './button';
import { Icon } from './icon';

/** Tramo de pista visto desde arriba con el daño marcado en ámbar (mismo dibujo que la plataforma web). */
export function DamageDrawing({ type }: { type: IncidentType }) {
  const drawing = DAMAGE_DRAWINGS[type];
  const { highlight } = drawing;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${DRAWING_SIZE.width} ${DRAWING_SIZE.height}`}
      accessibilityLabel={`Dibujo de referencia: ${TYPE_LABELS[type]}`}>
      <Rect width={DRAWING_SIZE.width} height={DRAWING_SIZE.height} fill={ROAD.shoulder} />
      <Rect {...ROAD.asphaltRect} fill={ROAD.asphalt} />
      {ROAD.edgeLines.map((d) => (
        <Path key={d} d={d} stroke={ROAD.paint} strokeWidth={3} />
      ))}
      <Path d={ROAD.centerLine} stroke={ROAD.paint} strokeWidth={3} strokeDasharray="22 14" />
      {ROAD.arrows.map((d) => (
        <Path key={d} d={d} stroke={ROAD.paint} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      ))}
      {drawing.ellipses.map((e) => (
        <Ellipse key={`${e.cx}-${e.cy}-${e.rx}`} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={e.fill} stroke={e.stroke} strokeWidth={e.stroke ? 3 : 0} />
      ))}
      {drawing.cracks.map((d) => (
        <Path key={d} d={d} stroke={ROAD.crack} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {highlight.kind === 'rect' ? (
        <Rect x={highlight.x} y={highlight.y} width={highlight.width} height={highlight.height} rx={6} fill="none" stroke={ROAD.mark} strokeWidth={2.5} strokeDasharray="7 5" />
      ) : (
        <Ellipse cx={highlight.cx} cy={highlight.cy} rx={highlight.rx} ry={highlight.ry} fill="none" stroke={ROAD.mark} strokeWidth={2.5} strokeDasharray="7 5" />
      )}
    </Svg>
  );
}

/** Hoja que sube desde abajo con el significado de un tipo de daño. */
export function DamageHelpSheet({ type, onClose }: { type: IncidentType | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const info = type ? DAMAGE_INFO[type] : null;
  return (
    <Modal visible={type != null} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      {type && info ? (
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.head}>
            <Icon name="help-outline" size={22} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={styles.title}>{TYPE_LABELS[type]}</Text>
              <Text style={styles.subtitle}>Clase {type} del modelo LMD-YOLO</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10}>
              <Icon name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.summary}>{info.summary}</Text>
            <View style={styles.drawing}>
              <DamageDrawing type={type} />
            </View>
            <Text style={styles.caption}>
              Dibujo de referencia: pista vista desde arriba, los vehículos avanzan hacia la derecha. El daño está marcado en ámbar.
            </Text>
            <View style={styles.sectionTitle}>
              <Icon name="visibility" size={16} color={colors.primary} />
              <Text style={styles.sectionTitleText}>Cómo reconocerlo en la foto</Text>
            </View>
            {info.howToSpot.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.text}>•</Text>
                <Text style={[styles.text, styles.flex]}>{line}</Text>
              </View>
            ))}
            <View style={styles.sectionTitle}>
              <Icon name="construction" size={16} color={colors.primary} />
              <Text style={styles.sectionTitleText}>Por qué aparece</Text>
            </View>
            <Text style={styles.text}>{info.cause}</Text>
          </ScrollView>
          <Button title="Entendido" onPress={onClose} />
        </View>
      ) : null}
    </Modal>
  );
}

/** Ícono de información junto al nombre de un tipo de daño; al tocarlo explica qué significa. */
export function DamageHelpButton({ type, color = colors.primary }: { type: IncidentType; color?: string }) {
  const [shown, setShown] = useState<IncidentType | null>(null);
  return (
    <>
      <Pressable
        onPress={() => setShown(type)}
        accessibilityRole="button"
        accessibilityLabel={`¿Qué es ${TYPE_LABELS[type].toLowerCase()}?`}
        hitSlop={10}
        style={styles.button}>
        <Icon name="info-outline" size={18} color={color} />
      </Pressable>
      <DamageHelpSheet type={shown} onClose={() => setShown(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,32,66,0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  flex: { flex: 1 },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.textStrong },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  body: { gap: 10, paddingBottom: 4 },
  summary: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  drawing: { width: '100%', aspectRatio: DRAWING_SIZE.width / DRAWING_SIZE.height, borderRadius: 8, overflow: 'hidden' },
  caption: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: colors.textMuted },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sectionTitleText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textStrong },
  bullet: { flexDirection: 'row', gap: 6 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  button: { padding: 2 },
});
