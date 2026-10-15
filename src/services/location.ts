import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

import type { Coordinates } from './report-service';

export type DeviceLocation = { coordinates: Coordinates; accuracy: number | null };

/** denied: el ciudadano no dio permiso. unavailable: hay permiso, pero el GPS está apagado o no dio posición. */
export type LocationResult = { status: 'ok'; location: DeviceLocation } | { status: 'denied' } | { status: 'unavailable' };

/** Pide permiso de ubicación y la posición actual, indicando por qué falló si no se obtiene. */
export async function locate(): Promise<LocationResult> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return { status: 'denied' };
  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      status: 'ok',
      location: {
        coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        accuracy: position.coords.accuracy ?? null,
      },
    };
  } catch {
    return { status: 'unavailable' };
  }
}

/**
 * Lleva al ciudadano a donde puede solucionar el problema: los permisos de la app si los negó,
 * o el aviso del sistema para encender la ubicación si el GPS está apagado (Android).
 */
export async function openLocationSettings(reason: 'denied' | 'unavailable'): Promise<void> {
  if (reason === 'unavailable' && Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
      return;
    } catch {
      // Si el aviso del sistema no está disponible, se abren los ajustes de la app.
    }
  }
  await Linking.openSettings();
}

/** Dirección aproximada (calle y distrito) usando el geocodificador del celular; null si no hay datos. */
export async function addressFor(coordinates: Coordinates): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coordinates);
    if (!place) return null;
    const street = [place.street ?? place.name, place.streetNumber].filter(Boolean).join(' ');
    const area = place.district ?? place.subregion ?? place.city;
    const parts = [street, area].filter((part): part is string => Boolean(part));
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}
