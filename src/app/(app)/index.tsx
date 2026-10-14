import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { incidentApi } from '@/api/incident-api';
import { colors, radius, spacing } from '@/constants/theme';
import { TYPE_LABELS, type IncidentSummary } from '@/domain/incident';
import { useSession } from '@/session/session-context';
import { Button } from '@/ui/button';
import { formatDate } from '@/ui/format';
import { StatusBadge } from '@/ui/status-badge';

export default function MyReportsScreen() {
  const { user, signOut } = useSession();
  const [items, setItems] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await incidentApi.mine();
      setItems(page.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus reportes.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Se recarga cada vez que la pantalla vuelve a estar visible (por ejemplo, al terminar un reporte).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => void signOut()} hitSlop={8}>
              <Text style={styles.logout}>Salir</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.greeting}>Hola, {user?.fullName}</Text>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={
          loading ? null : <Text style={styles.empty}>Aún no tienes reportes. Toma una foto de un daño en la pista para empezar.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/report/${item.id}`)}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{TYPE_LABELS[item.type]}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardMeta}>{item.district ?? 'Distrito por identificar'}</Text>
            <Text style={styles.cardMeta}>
              {formatDate(item.createdAt)}
              {item.aiValidated ? ' · Validado por IA' : ''}
            </Text>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button title="Nuevo reporte" onPress={() => router.push('/report/new')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  greeting: { fontSize: 18, fontWeight: '600', color: colors.text },
  error: { color: colors.danger },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  cardMeta: { color: colors.textSecondary, fontSize: 14 },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  logout: { color: colors.primary, fontWeight: '600', fontSize: 16 },
});
