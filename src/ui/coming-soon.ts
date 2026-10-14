import { Alert } from 'react-native';

/** Para botones del diseño cuya función aún no existe en el backend. */
export function comingSoon(feature: string) {
  Alert.alert(feature, 'Esta función estará disponible próximamente.');
}
