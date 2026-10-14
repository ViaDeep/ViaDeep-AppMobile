import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useSession } from '@/session/session-context';

/** Todas las pantallas de este grupo requieren sesión iniciada. */
export default function ProtectedLayout() {
  const { loading, user } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'Mis reportes' }} />
      <Stack.Screen name="report/new" options={{ title: 'Nuevo reporte' }} />
      <Stack.Screen name="report/[id]" options={{ title: 'Detalle del reporte' }} />
    </Stack>
  );
}
