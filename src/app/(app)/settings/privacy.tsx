import { useCameraPermissions, type PermissionResponse } from 'expo-camera';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';
import { Icon, type IconName } from '@/ui/icon';
import { InfoNote, SettingsRow, SettingsSection, StateTag } from '@/ui/settings';
import { BackHeader } from '@/ui/top-bar';

type DataItem = { icon: IconName; title: string; body: string };

const DATA_WE_USE: DataItem[] = [
  {
    icon: 'person-outline',
    title: 'Datos de tu cuenta',
    body: 'Nombre y correo para identificarte. El celular y el DNI son opcionales y solo los ve la municipalidad.',
  },
  {
    icon: 'photo-camera',
    title: 'Foto del daño',
    body: 'Se guarda en un almacenamiento privado. Solo se muestra con enlaces temporales a ti y a los operadores municipales.',
  },
  {
    icon: 'place',
    title: 'Ubicación GPS',
    body: 'Se toma solo al momento de reportar, para ubicar el daño y su distrito. La app no te rastrea en segundo plano.',
  },
  {
    icon: 'memory',
    title: 'Análisis con IA en el celular',
    body: 'La detección del tipo de daño con el modelo LMD-YOLO se hará dentro de tu celular (on-device), sin enviar la foto a un servidor externo para analizarla. Mientras se integra, eliges el tipo de daño a mano.',
  },
];

export default function PrivacyScreen() {
  const [camera, requestCamera, getCamera] = useCameraPermissions();
  const [location, requestLocation, getLocation] = Location.useForegroundPermissions();

  useFocusEffect(
    useCallback(() => {
      // Al volver de los ajustes del sistema el permiso pudo cambiar.
      void getCamera();
      void getLocation();
    }, [getCamera, getLocation]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Privacidad" step="PERMISOS Y DATOS" />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="PERMISOS DEL DISPOSITIVO" footer="Toca un permiso para concederlo o cambiarlo en los ajustes del celular.">
          <PermissionRow
            first
            icon="photo-camera"
            title="Cámara"
            subtitle="Para fotografiar el daño en la vía"
            permission={camera}
            request={requestCamera}
          />
          <PermissionRow
            icon="my-location"
            title="Ubicación"
            subtitle="Para registrar dónde está el daño"
            permission={location}
            request={requestLocation}
          />
        </SettingsSection>

        <SettingsSection title="QUÉ DATOS USAMOS Y PARA QUÉ">
          {DATA_WE_USE.map((item, index) => (
            <View key={item.title} style={[styles.dataItem, index > 0 && styles.border]}>
              <View style={styles.dataIcon}>
                <Icon name={item.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.flexShrink}>
                <Text style={styles.dataTitle}>{item.title}</Text>
                <Text style={styles.dataBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </SettingsSection>

        <SettingsSection title="TUS DERECHOS">
          <View style={styles.rights}>
            <Text style={styles.dataBody}>
              Tus datos personales se tratan conforme a la Ley N.° 29733, Ley de Protección de Datos Personales. Puedes
              pedir el acceso, la rectificación, la cancelación o la oposición al uso de tus datos (derechos ARCO).
            </Text>
            <Text style={styles.dataBody}>
              Tu nombre, celular y DNI los puedes corregir tú mismo desde Editar perfil. Para lo demás, escribe desde
              Ayuda y soporte.
            </Text>
          </View>
        </SettingsSection>

        <InfoNote icon="shield">Los operadores municipales ven tus reportes para atenderlos. Otros ciudadanos no pueden ver tus reportes ni tus datos.</InfoNote>
      </ScrollView>
    </SafeAreaView>
  );
}

type PermissionRowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  first?: boolean;
  permission: PermissionResponse | null;
  request: () => Promise<PermissionResponse>;
};

function PermissionRow({ icon, title, subtitle, first, permission, request }: PermissionRowProps) {
  const granted = permission?.granted ?? false;
  const asked = permission ? permission.status !== 'undetermined' : false;

  function onPress() {
    if (!granted && permission?.canAskAgain !== false) {
      void request();
    } else {
      void Linking.openSettings();
    }
  }

  return (
    <SettingsRow
      first={first}
      icon={icon}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      right={<StateTag label={granted ? 'PERMITIDO' : asked ? 'DENEGADO' : 'SIN SOLICITAR'} tone={granted ? 'success' : asked ? 'warning' : 'muted'} />}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexShrink: { flexShrink: 1 },
  content: { padding: 16, gap: 20, paddingBottom: 32 },
  dataItem: { flexDirection: 'row', gap: 12, padding: 14 },
  border: { borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  dataIcon: { width: 32, height: 32, borderRadius: 4, backgroundColor: colors.surfaceBlue, alignItems: 'center', justifyContent: 'center' },
  dataTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.textStrong },
  dataBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  rights: { padding: 14, gap: 10 },
});
