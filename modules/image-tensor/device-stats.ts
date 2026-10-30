import { requireOptionalNativeModule } from 'expo';

/** Una lectura del celular durante la prueba de uso continuo. null = Android no lo informa en este celular. */
export type DeviceSnapshot = {
  pssMb: number;
  javaHeapMb: number;
  nativeHeapMb: number;
  batteryTempC: number | null;
  batteryPercent: number | null;
  charging: boolean;
  thermalStatus: number | null;
  thermalHeadroom: number | null;
};

type DeviceStatsModule = {
  snapshot(): Promise<DeviceSnapshot>;
  setKeepScreenOn(on: boolean): Promise<void>;
};

/** null en Expo Go o en un APK anterior a este módulo. */
export default requireOptionalNativeModule<DeviceStatsModule>('DeviceStats');
