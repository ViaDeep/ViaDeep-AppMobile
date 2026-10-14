import { Redirect } from 'expo-router';

/** La pestaña "Reportar" abre la cámara desde la barra inferior; esta ruta solo existe para la pestaña. */
export default function ReportTab() {
  return <Redirect href="/report/camera" />;
}
