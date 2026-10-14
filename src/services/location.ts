import * as Location from 'expo-location';

import type { Coordinates } from './report-service';

export type DeviceLocation = { coordinates: Coordinates; accuracy: number | null };

/** Pide permiso de ubicación y devuelve la posición actual, o null si el usuario no lo concede. */
export async function currentLocation(): Promise<DeviceLocation | null> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return null;
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return {
    coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    accuracy: position.coords.accuracy ?? null,
  };
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
