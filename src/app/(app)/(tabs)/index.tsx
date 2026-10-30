import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecentReportCard } from '@/components/report-cards';
import { colors, fonts } from '@/constants/theme';
import { useReports } from '@/reports/reports-context';
import { useSession } from '@/session/session-context';
import { Button } from '@/ui/button';
import { Chip } from '@/ui/chip';
import { Icon } from '@/ui/icon';
import { Logo } from '@/ui/logo';

const RECENT_COUNT = 3;

export default function HomeScreen() {
  const { user } = useSession();
  const { reports, totalReports, loading, error, unreadCount, refresh } = useReports();
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? 'ciudadano';

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Logo size="sm" />
          <View style={styles.headerDivider} />
          <Chip label="LIMA METRO" shape="tag" background={colors.surfaceBlueStrong} color={colors.primary} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          onPress={() => router.navigate('/notifications')}
          hitSlop={8}
          style={styles.bell}>
          <Icon name="notifications-none" size={22} color={colors.textStrong} />
          {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => refresh(true)} />}>
        <View style={styles.greeting}>
          <Text style={styles.hello}>Hola, {firstName}</Text>
          <Text style={styles.welcome}>Bienvenido al portal de reporte vial de Lima</Text>
        </View>

        <LinearGradient
          colors={[colors.navy, colors.navyMid, colors.navyLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroGrid}>
            <View style={styles.heroGridInner} />
          </View>
          <View style={styles.heroChip}>
            <Icon name="memory" size={11} color={colors.background} />
            <Text style={styles.heroChipText}>CV EDGE v2.4</Text>
          </View>
          <View style={styles.heroEyebrow}>
            <Icon name="center-focus-strong" size={12} color={colors.surfaceBlueSoft} />
            <Text style={styles.heroEyebrowText}>DETECCIÓN AUTOMATIZADA</Text>
          </View>
          <Text style={styles.heroTitle}>¿Detectaste una incidencia vial?</Text>
          <Text style={styles.heroText}>
            Captura una foto de baches, grietas o hundimientos. Nuestro modelo IA identificará el daño al instante.
          </Text>
          <Button
            title="Registrar incidencia"
            variant="primary"
            icon="add-a-photo"
            onPress={() => router.push('/report/camera')}
            style={styles.heroButton}
          />
        </LinearGradient>

        <View style={styles.info}>
          <View style={styles.infoIcon}>
            <Icon name="auto-awesome" size={16} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>
            Tu reporte será analizado mediante inteligencia artificial y enviado a la Municipalidad Metropolitana de Lima.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Mis reportes</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalReports}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.navigate('/reports')} hitSlop={8} style={styles.seeAll}>
            <Text style={styles.seeAllText}>Ver todos</Text>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && reports.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="add-road" size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aún no tienes reportes. Registra tu primera incidencia con la cámara.</Text>
          </View>
        ) : null}
        <View style={styles.list}>
          {reports.slice(0, RECENT_COUNT).map((incident) => (
            <RecentReportCard key={incident.id} incident={incident} onPress={() => router.push(`/report/${incident.id}`)} />
          ))}
        </View>

        {reports.length > 0 ? (
          <Pressable onPress={() => router.navigate('/reports')} style={({ pressed }) => [styles.allButton, pressed && styles.pressed]}>
            <Text style={styles.allButtonText}>Ver todos mis reportes</Text>
            <Icon name="arrow-forward" size={14} color={colors.text} />
          </Pressable>
        ) : null}

        <View style={styles.telemetry}>
          <View style={styles.telemetryLabel}>
            <Icon name="show-chart" size={16} color={colors.primary} />
            <Text style={styles.telemetryText}>Respuesta promedio en vía metropolitana:</Text>
          </View>
          <Text style={styles.telemetryValue}>24-48 hrs</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.7 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderFaint,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDivider: { width: 1, height: 16, backgroundColor: colors.border },
  bell: { padding: 8 },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBright,
    borderWidth: 2,
    borderColor: colors.background,
  },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 12 },
  greeting: { gap: 2, paddingTop: 4 },
  hello: { fontFamily: fonts.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.6, color: colors.textStrong },
  welcome: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  hero: { borderRadius: 8, padding: 21, overflow: 'hidden', gap: 8 },
  heroGrid: {
    position: 'absolute',
    right: -32,
    bottom: -32,
    width: 160,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(216,226,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGridInner: { width: 96, height: 96, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(216,226,255,0.2)' },
  heroChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroChipText: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 15, color: colors.background },
  heroEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroEyebrowText: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 16.5, letterSpacing: 0.55, color: colors.surfaceBlueSoft },
  heroTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22.5, color: colors.white, paddingTop: 4 },
  heroText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19.5, color: 'rgba(211,228,254,0.9)', paddingBottom: 8 },
  heroButton: { borderRadius: 4 },
  info: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceBlueStrong,
    borderRadius: 8,
    padding: 15,
  },
  infoIcon: { width: 30, height: 30, borderRadius: 4, backgroundColor: colors.surfaceBlueStrong, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16.5, color: colors.textSecondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.textStrong },
  countBadge: { backgroundColor: colors.surfaceBlue, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  countText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, color: colors.primary },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.primary },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  empty: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  list: { gap: 8 },
  allButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  allButtonText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  telemetry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 15,
  },
  telemetryLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  telemetryText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16.5, color: colors.textSecondary },
  telemetryValue: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.44, color: colors.text },
});
