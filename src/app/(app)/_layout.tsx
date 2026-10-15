import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/theme';
import { PendingReportsProvider } from '@/offline/pending-reports-context';
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
      <PendingReportsProvider>
        <ReportFlowProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="report/camera" options={{ contentStyle: { backgroundColor: colors.text } }} />
            <Stack.Screen name="report/preview" />
            <Stack.Screen name="report/result" />
            <Stack.Screen name="report/confirmation" options={{ gestureEnabled: false }} />
            <Stack.Screen name="report/[id]" />
            <Stack.Screen name="settings/edit-profile" />
            <Stack.Screen name="settings/personal-data" />
            <Stack.Screen name="settings/notifications" />
            <Stack.Screen name="settings/privacy" />
            <Stack.Screen name="settings/help" />
          </Stack>
        </ReportFlowProvider>
      </PendingReportsProvider>
    </ReportsProvider>
  );
}
