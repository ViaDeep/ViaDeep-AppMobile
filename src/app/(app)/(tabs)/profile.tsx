import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { initials } from '@/domain/display';
import { useReports } from '@/reports/reports-context';
import { useSession } from '@/session/session-context';
import { Icon, type IconName } from '@/ui/icon';
import { BrandHeader } from '@/ui/top-bar';

type MenuItem = { icon: IconName; title: string; subtitle: string; onPress: () => void };

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  const { reports, totalReports, refresh } = useReports();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const resolved = reports.filter((incident) => incident.status === 'RESOLVED').length;

  const menu: MenuItem[] = [
    { icon: 'badge', title: 'Datos personales', subtitle: 'Nombre, correo, celular y DNI', onPress: () => router.push('/settings/personal-data') },
    { icon: 'notifications-none', title: 'Notificaciones', subtitle: 'Alertas de estado de incidencias', onPress: () => router.push('/settings/notifications') },
    { icon: 'privacy-tip', title: 'Privacidad', subtitle: 'Permisos de cámara y ubicación, uso de datos', onPress: () => router.push('/settings/privacy') },
    { icon: 'help-outline', title: 'Ayuda y soporte', subtitle: 'Manual cívico y preguntas frecuentes', onPress: () => router.push('/settings/help') },
  ];

  function confirmSignOut() {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <BrandHeader section="Perfil" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(user?.fullName ?? '')}</Text>
              </View>
            </View>
            <View style={styles.verified}>
              <Icon name="check" size={11} color={colors.white} />
            </View>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.citizenTag}>
            <Icon name="verified-user" size={12} color={colors.textSecondary} />
            <Text style={styles.citizenTagText}>Ciudadano Registrado · Lima Metropolitana</Text>
          </View>
          <Pressable onPress={() => router.push('/settings/edit-profile')} style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
            <Icon name="edit" size={13} color={colors.text} />
            <Text style={styles.editText}>Editar perfil</Text>
          </Pressable>
        </View>

        <View style={styles.stats}>
          <Stat label="ENVIADOS" value={totalReports} caption="Reportes realizados" icon="send" iconBackground={colors.surfaceBlue} iconColor={colors.primary} />
          <Stat
            label="ATENDIDOS"
            value={resolved}
            caption="Incidencias resueltas"
            icon="task-alt"
            iconBackground="#ECFDF5"
            iconColor="#059669"
            valueColor="#059669"
          />
        </View>

        <View style={styles.menu}>
          {menu.map((item, index) => (
            <Pressable
              key={item.title}
              onPress={item.onPress}
              style={({ pressed }) => [styles.menuItem, index > 0 && styles.menuBorder, pressed && styles.pressed]}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Icon name={item.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.flexShrink}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Icon name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={confirmSignOut} style={({ pressed }) => [styles.menu, styles.menuItem, pressed && styles.pressed]}>
          <View style={styles.menuLeft}>
            <View style={[styles.menuIcon, styles.logoutIcon]}>
              <Icon name="logout" size={16} color={colors.danger} />
            </View>
            <View style={styles.flexShrink}>
              <Text style={[styles.menuTitle, styles.logoutText]}>Cerrar sesión</Text>
              <Text style={styles.menuSubtitle}>Finalizar sesión en este dispositivo</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Icon name="account-balance" size={11} color="rgba(69,70,78,0.7)" />
            <Text style={styles.footerText}>ViaDeep v2.4 · Municipalidad Metropolitana de Lima</Text>
          </View>
          <Text style={styles.footerSub}>Subgerencia de Fiscalización y Gestión Vial</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type StatProps = {
  label: string;
  value: number;
  caption: string;
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  valueColor?: string;
};

function Stat({ label, value, caption, icon, iconBackground, iconColor, valueColor = colors.text }: StatProps) {
  return (
    <View style={styles.stat}>
      <View style={styles.statHeader}>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={15} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.statValue, { color: valueColor }]}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.statCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  pressed: { opacity: 0.7 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 16 },
  identity: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 8,
    padding: 12,
  },
  avatarWrap: { marginBottom: 12 },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,87,192,0.2)',
    backgroundColor: colors.surfaceBlue,
    padding: 6,
  },
  avatar: { flex: 1, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.55, color: colors.background },
  verified: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, letterSpacing: -0.45, color: colors.text, textAlign: 'center' },
  email: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.44, color: colors.textSecondary, marginTop: 2 },
  citizenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.5)',
    backgroundColor: colors.surfaceMuted,
  },
  citizenTagText: { fontFamily: fonts.monoMedium, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  edit: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 9,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(197,198,207,0.7)',
    backgroundColor: colors.background,
  },
  editText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.text },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    borderRadius: 8,
    padding: 13,
    gap: 4,
  },
  statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 },
  statLabel: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.textSecondary },
  statIcon: { width: 28, height: 28, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: fonts.monoBold, fontSize: 26, lineHeight: 28 },
  statCaption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 15, color: colors.textSecondary },
  menu: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderFaint, borderRadius: 8, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  menuSubtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  logoutIcon: { backgroundColor: 'rgba(255,218,214,0.4)' },
  logoutText: { color: colors.danger },
  footer: { alignItems: 'center', gap: 2, paddingTop: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: 'rgba(69,70,78,0.7)', textAlign: 'center' },
  footerSub: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 20, color: colors.textMuted },
});
