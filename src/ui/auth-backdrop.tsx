import { StyleSheet, View } from 'react-native';

/** Formas de fondo suaves del login y registro. */
export function AuthBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.shape, styles.topRight]} />
      <View style={[styles.shape, styles.left]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shape: { position: 'absolute', borderRadius: 120 },
  topRight: { width: 288, height: 288, top: -96, right: -96, backgroundColor: 'rgba(216,226,255,0.35)' },
  left: { width: 256, height: 260, top: '33%', left: -150, backgroundColor: 'rgba(220,233,255,0.45)' },
});
