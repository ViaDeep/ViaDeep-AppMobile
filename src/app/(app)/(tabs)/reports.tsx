import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PendingReportCard } from '@/components/pending-report-card';
import { placeLabel, ReportListCard } from '@/components/report-cards';
import { colors, fonts } from '@/constants/theme';
import { citizenStatus, reportCode, type CitizenStatus } from '@/domain/display';
import { TYPE_LABELS, type IncidentDetail } from '@/domain/incident';
import { usePendingReports } from '@/offline/pending-reports-context';
import { useReports } from '@/reports/reports-context';
import { Icon } from '@/ui/icon';
import { BrandHeader } from '@/ui/top-bar';

type Filter = 'ALL' | Exclude<CitizenStatus, 'REJECTED'>;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'REGISTERED', label: 'Registrados' },
  { key: 'IN_REVIEW', label: 'En revisión' },
  { key: 'IN_PROGRESS', label: 'En proceso' },
  { key: 'RESOLVED', label: 'Resueltos' },
];

const statusOf = (incident: IncidentDetail) => citizenStatus(incident.status, incident.severity);

export default function MyReportsScreen() {
  const { reports, loading, error, refresh } = useReports();
  const { pending, send, discard } = usePendingReports();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [oldestFirst, setOldestFirst] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const items = reports.filter((incident) => {
      if (filter !== 'ALL' && statusOf(incident) !== filter) return false;
      if (!text) return true;
      const haystack = `${reportCode(incident.id, incident.createdAt)} ${TYPE_LABELS[incident.type]} ${placeLabel(incident)}`;
      return haystack.toLowerCase().includes(text);
    });
    return oldestFirst ? [...items].reverse() : items;
  }, [reports, filter, query, oldestFirst]);

  const active = reports.filter((incident) => !['RESOLVED', 'REJECTED'].includes(statusOf(incident))).length;

  async function sendPending(localId: string) {
    try {
      const id = await send(localId);
      void refresh(true);
      Alert.alert('Reporte enviado', `Tu incidencia fue registrada con el código ${reportCode(id, new Date().toISOString())}.`);
    } catch (e) {
      Alert.alert('No se pudo enviar', e instanceof Error ? e.message : 'Intenta de nuevo cuando tengas conexión.');
    }
  }

  function chooseOrder() {
    Alert.alert('Ordenar reportes', undefined, [
      { text: 'Más recientes primero', onPress: () => setOldestFirst(false) },
      { text: 'Más antiguos primero', onPress: () => setOldestFirst(true) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <BrandHeader />
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.titleRow}>
              <View style={styles.flexShrink}>
                <Text style={styles.title}>Mis reportes</Text>
                <Text style={styles.subtitle}>Consulta el estado de tus incidencias viales</Text>
              </View>
              <View style={styles.tools}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Buscar reportes"
                  onPress={() => {
                    setSearching((value) => !value);
                    setQuery('');
                  }}
                  style={[styles.tool, searching && styles.toolActive]}>
                  <Icon name="search" size={16} color={searching ? colors.white : colors.textStrong} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Ordenar reportes" onPress={chooseOrder} style={styles.tool}>
                  <Icon name="tune" size={16} color={colors.textStrong} />
                </Pressable>
              </View>
            </View>

            {searching ? (
              <View style={styles.search}>
                <Icon name="search" size={16} color={colors.textMuted} />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Código, tipo de daño o distrito"
                  placeholderTextColor={colors.placeholder}
                  style={styles.searchInput}
                />
              </View>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
              {FILTERS.map(({ key, label }) => {
                const selected = filter === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setFilter(key)}
                    style={[styles.pill, selected && styles.pillSelected]}>
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
                    {key === 'ALL' && selected ? (
                      <View style={styles.pillCount}>
                        <Text style={styles.pillCountText}>{reports.length}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.summary}>
              <View style={styles.summaryLeft}>
                <View style={styles.summaryDot} />
                <Text style={styles.summaryText}>
                  {active === 1 ? '1 incidencia activa en seguimiento' : `${active} incidencias activas en seguimiento`}
                </Text>
              </View>
              <Text style={styles.summaryTag}>LIMA METRO</Text>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {pending.length > 0 ? (
              <View style={styles.pending}>
                <Text style={styles.pendingTitle}>
                  {pending.length === 1 ? '1 reporte pendiente de envío' : `${pending.length} reportes pendientes de envío`}
                </Text>
                {pending.map((report) => (
                  <PendingReportCard key={report.localId} report={report} onSend={sendPending} onDiscard={discard} />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Icon name="inbox" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                {reports.length === 0 ? 'Aún no tienes reportes registrados.' : 'No hay reportes con este filtro.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <ReportListCard incident={item} onPress={() => router.push(`/report/${item.id}`)} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  headerBlock: { gap: 12, paddingTop: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  tools: { flexDirection: 'row', gap: 6, paddingTop: 4 },
  tool: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.7)',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  pills: { gap: 8, paddingVertical: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  pillSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  pillText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  pillTextSelected: { fontFamily: fonts.medium, color: colors.white },
  pillCount: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 6 },
  pillCountText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.white },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.5)',
    backgroundColor: colors.surfaceMuted,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  summaryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  summaryText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.text },
  summaryTag: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.5, color: colors.textSecondary },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  pending: { gap: 8 },
  pendingTitle: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.text },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
