import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { formatCoordinates, relativeTime } from '@/domain/display';
import { TYPE_LABELS } from '@/domain/incident';
import type { PendingReport } from '@/offline/pending-reports';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';

type Props = {
  report: PendingReport;
  onSend: (localId: string) => Promise<void>;
  onDiscard: (localId: string) => Promise<void>;
};

/** Reporte guardado sin conexión, con la opción de enviarlo cuando vuelva el internet. */
export function PendingReportCard({ report, onSend, onDiscard }: Props) {
  const [sending, setSending] = useState(false);
  const type = report.detection?.type ?? report.manualType;
  const place = report.address ?? formatCoordinates(report.coordinates.latitude, report.coordinates.longitude);

  async function send() {
    setSending(true);
    try {
      await onSend(report.localId);
    } finally {
      setSending(false);
    }
  }

  function discard() {
    Alert.alert('¿Descartar este reporte?', 'Se borrará del celular y no se enviará a la Municipalidad.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => void onDiscard(report.localId) },
    ]);
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Icon name="cloud-off" size={16} color={colors.warningText} />
        </View>
        <View style={styles.flexShrink}>
          <Text style={styles.title}>{type ? TYPE_LABELS[type] : 'Incidencia vial'}</Text>
          <Text style={styles.place} numberOfLines={1}>
            {place}
          </Text>
        </View>
        <Text style={styles.badge}>PENDIENTE</Text>
      </View>
      <Text style={styles.saved}>Guardado sin conexión · {relativeTime(report.savedAt)}</Text>
      <View style={styles.actions}>
        <Button title="Enviar ahora" variant="primary" size="sm" icon="send" onPress={() => void send()} loading={sending} style={styles.send} />
        <Button title="Descartar" variant="outline" size="sm" icon="delete-outline" onPress={discard} disabled={sending} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1, flex: 1 },
  card: {
    gap: 10,
    padding: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSurface,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18, color: colors.text },
  place: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  badge: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.warningText },
  saved: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.warningText },
  actions: { flexDirection: 'row', gap: 8 },
  send: { flex: 1 },
});
