/**
 * En desarrollo el celular descarga la app desde Expo, que corre en la misma PC que el backend. Así, la IP
 * con la que el celular llega a Expo es la IP actual de la PC, aunque haya cambiado desde que se escribió el
 * `.env` (otra red Wi-Fi, el router asignó otra dirección).
 */

const PRIVATE_HOST = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;

/** Host (sin puerto) desde el que Expo sirve la app, por ejemplo "192.168.1.40" de "192.168.1.40:8090". */
export function devServerHost(hostUri: string | null | undefined): string | null {
  const host = hostUri?.trim().replace(/^[a-z]+:\/\//i, '').split('/')[0].replace(/:\d+$/, '');
  return host ? host : null;
}

/**
 * Cambia el host de una URL del backend por el de la PC de desarrollo, conservando el puerto. Solo toca
 * direcciones locales (localhost o IP privada): un backend en internet se deja tal cual.
 */
export function withDevHost(url: string, devHost: string | null): string {
  if (!devHost) return url;
  const match = /^(https?:\/\/)([^/:]+)(.*)$/i.exec(url);
  if (!match || !PRIVATE_HOST.test(match[2]) || !PRIVATE_HOST.test(devHost)) return url;
  return `${match[1]}${devHost}${match[3]}`;
}
