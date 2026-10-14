import { router } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, shadow } from '@/constants/theme';
import { useReports } from '@/reports/reports-context';
import { Icon, type IconName } from '@/ui/icon';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Inicio', icon: 'grid-view' },
  reportar: { label: 'Reportar', icon: 'add-a-photo' },
  reports: { label: 'Mis Reportes', icon: 'fact-check' },
  notifications: { label: 'Notificaciones', icon: 'notifications-none' },
  profile: { label: 'Perfil', icon: 'account-circle' },
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="reportar" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

/** Barra inferior de los mockups: "Reportar" es un botón elevado que abre la cámara. */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useReports();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: 64 + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const raised = route.name === 'reportar';
        const color = focused ? colors.primary : colors.textSecondary;

        function onPress() {
          if (raised) {
            router.push('/report/camera');
            return;
          }
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={onPress}
            style={styles.item}>
            {raised ? (
              <View style={styles.raised}>
                <Icon name={tab.icon} size={20} color={colors.white} />
              </View>
            ) : (
              <View>
                <Icon name={tab.icon} size={20} color={color} />
                {route.name === 'notifications' && unreadCount > 0 ? <View style={styles.dot} /> : null}
              </View>
            )}
            <Text numberOfLines={1} style={[styles.label, { color }, raised && styles.raisedLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 2, height: 64, paddingHorizontal: 2 },
  raised: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    ...shadow.raised,
  },
  raisedLabel: { marginTop: 0 },
  dot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  label: { fontFamily: fonts.monoBold, fontSize: 10, lineHeight: 14 },
});
