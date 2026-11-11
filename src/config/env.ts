import Constants from 'expo-constants';

import { devServerHost, withDevHost } from './dev-host';

/**
 * URLs de los microservicios. En desarrollo cada servicio corre en su propio puerto de la PC
 * (usa la IP de la PC en la red Wi-Fi, no localhost: el celular no ve el localhost de la PC).
 * En el servidor de la demo todas comparten una sola dirección https: basta con EXPO_PUBLIC_API_URL.
 * Si la IP de la PC cambia, se usa la IP con la que el celular llega a Expo en vez de la del `.env`.
 */
const devHost = devServerHost(Constants.expoConfig?.hostUri);

function readUrl(value: string | undefined, fallback: string): string {
  return withDevHost((value && value.trim().length > 0 ? value.trim() : fallback).replace(/\/+$/, ''), devHost);
}

/** Dirección única del servidor (por ejemplo https://viadeep-tesis.eastus.cloudapp.azure.com). */
const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();

const incidentsUrl = readUrl(process.env.EXPO_PUBLIC_INCIDENTS_URL, apiUrl || 'http://localhost:8082');

export const env = {
  authUrl: readUrl(process.env.EXPO_PUBLIC_AUTH_URL, apiUrl || 'http://localhost:8081'),
  incidentsUrl,
  evidencesUrl: readUrl(process.env.EXPO_PUBLIC_EVIDENCES_URL, apiUrl || 'http://localhost:8083'),
  /** Si no se configura, se usa el servidor único o la misma PC que incidencias con el puerto 8084. */
  notificationsUrl: readUrl(
    process.env.EXPO_PUBLIC_NOTIFICATIONS_URL,
    apiUrl || incidentsUrl.replace(/:8082$/, ':8084'),
  ),
  /** Confianza mínima de LMD-YOLO para registrar el reporte como validado por IA (RF de OB2). */
  aiConfidenceThreshold: Number(process.env.EXPO_PUBLIC_AI_CONFIDENCE_THRESHOLD ?? '0.5'),
  /** Correo de la mesa de ayuda que se muestra en "Ayuda y soporte". Si está vacío no se muestra. */
  supportEmail: (process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '').trim(),
} as const;
