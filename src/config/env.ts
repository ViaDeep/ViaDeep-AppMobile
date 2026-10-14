/**
 * URLs de los microservicios. En desarrollo cada servicio corre en su propio puerto de la PC
 * (usa la IP de la PC en la red Wi-Fi, no localhost: el celular no ve el localhost de la PC).
 * En producción todas apuntan al mismo API Gateway.
 */
function readUrl(value: string | undefined, fallback: string): string {
  return (value && value.trim().length > 0 ? value.trim() : fallback).replace(/\/+$/, '');
}

const incidentsUrl = readUrl(process.env.EXPO_PUBLIC_INCIDENTS_URL, 'http://localhost:8082');

export const env = {
  authUrl: readUrl(process.env.EXPO_PUBLIC_AUTH_URL, 'http://localhost:8081'),
  incidentsUrl,
  evidencesUrl: readUrl(process.env.EXPO_PUBLIC_EVIDENCES_URL, 'http://localhost:8083'),
  /** Si no se configura, se usa la misma PC que incidencias con el puerto 8084. */
  notificationsUrl: readUrl(process.env.EXPO_PUBLIC_NOTIFICATIONS_URL, incidentsUrl.replace(/:8082$/, ':8084')),
  /** Confianza mínima de LMD-YOLO para registrar el reporte como validado por IA (RF de OB2). */
  aiConfidenceThreshold: Number(process.env.EXPO_PUBLIC_AI_CONFIDENCE_THRESHOLD ?? '0.5'),
  /** Correo de la mesa de ayuda que se muestra en "Ayuda y soporte". Si está vacío no se muestra. */
  supportEmail: (process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '').trim(),
} as const;
