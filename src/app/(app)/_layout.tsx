import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { ReportFlowProvider } from '@/report-flow/report-flow';
import { ReportsProvider } from '@/reports/reports-context';
import { useSession } from '@/session/session-context';

/** Todas las pantallas de este grupo requieren sesión iniciada. */
export default function ProtectedLayout() {
  const { loading, user } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <ReportsProvider>
      <ReportFlowProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="report/camera" options={{ contentStyle: { backgroundColor: colors.text } }} />
          <Stack.Screen name="report/preview" />
          <Stack.Screen name="report/result" />
          <Stack.Screen name="report/confirmation" options={{ gestureEnabled: false }} />
          <Stack.Screen name="report/[id]" />
        </Stack>
      </ReportFlowProvider>
    </ReportsProvider>
  );
}
