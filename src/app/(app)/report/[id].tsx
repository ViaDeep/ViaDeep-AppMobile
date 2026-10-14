import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { evidenceApi } from '@/api/evidence-api';
import { incidentApi } from '@/api/incident-api';
import { colors, radius, spacing } from '@/constants/theme';
import { SEVERITY_LABELS, STATUS_LABELS, TYPE_LABELS, type IncidentDetail } from '@/domain/incident';
import { formatDate } from '@/ui/format';
import { StatusBadge } from '@/ui/status-badge';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await incidentApi.detail(id);
        if (cancelled) return;
        setIncident(detail);
        // La foto se pide aparte con una URL firmada de corta duración.
        const url = await evidenceApi.signedUrl(detail.evidenceId).catch(() => null);
        if (!cancelled) setPhotoUrl(url);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el reporte.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return <Text style={[styles.error, styles.container]}>{error}</Text>;
  }
  if (!incident) {
    return <ActivityIndicator style={styles.container} size="large" color={colors.primary} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.muted}>Foto no disponible</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.title}>{TYPE_LABELS[incident.type]}</Text>
        <StatusBadge status={incident.status} />
      </View>
      <Info label="Distrito" value={incident.district ?? 'Por identificar'} />
      <Info label="Ubicación" value={`${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`} />
      <Info label="Severidad" value={incident.severity ? SEVERITY_LABELS[incident.severity] : 'Sin asignar'} />
      <Info
        label="Validación"
        value={
          incident.aiValidated && incident.aiResult
            ? `IA (confianza ${(incident.aiResult.confidence * 100).toFixed(0)} %)`
            : 'Registro manual'
        }
      />
      {incident.description ? <Info label="Descripción" value={incident.description} /> : null}
      <Info label="Reportado" value={formatDate(incident.createdAt)} />

      <Text style={styles.section}>Historial</Text>
      {incident.history.map((entry, index) => (
        <View key={index} style={styles.historyItem}>
          <Text style={styles.historyTitle}>{STATUS_LABELS[entry.toStatus]}</Text>
          <Text style={styles.muted}>{formatDate(entry.changedAt)}</Text>
          {entry.comment ? <Text style={styles.value}>{entry.comment}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.border },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, flexShrink: 1 },
  info: { gap: 2 },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  value: { fontSize: 16, color: colors.text },
  muted: { color: colors.textSecondary },
  section: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  historyItem: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: spacing.sm, gap: 2 },
  historyTitle: { fontWeight: '600', color: colors.text },
  error: { color: colors.danger },
});
