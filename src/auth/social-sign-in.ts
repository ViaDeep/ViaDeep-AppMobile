import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { env } from '@/config/env';

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'google' | 'microsoft';

/** Cuentas personales de Microsoft (Outlook, Hotmail, Live): el backend solo acepta estas. */
const MICROSOFT_ISSUER = 'https://login.microsoftonline.com/consumers/v2.0';

/** Ruta de la app a la que Microsoft vuelve con el código (viadeep://oauth). */
export const MICROSOFT_REDIRECT_PATH = 'oauth';

const NEEDS_NEW_APK = 'Para usar esta opción instala la versión más reciente de la app.';

/**
 * Abre el inicio de sesión del proveedor y devuelve su token de identidad (id_token), o null si la persona lo
 * cancela. El token se envía al backend, que lo verifica y entrega la sesión de ViaDeep.
 */
export async function getIdToken(provider: SocialProvider): Promise<string | null> {
  return provider === 'google' ? googleIdToken() : microsoftIdToken();
}

/**
 * Google con el selector de cuentas nativo de Android. La librería es nativa: se carga recién aquí para que la app
 * siga abriendo en Expo Go o en un APK anterior, donde no existe.
 */
async function googleIdToken(): Promise<string | null> {
  if (!env.googleWebClientId) {
    throw new Error('El inicio de sesión con Google aún no está configurado.');
  }
  let google: typeof import('@react-native-google-signin/google-signin');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    google = require('@react-native-google-signin/google-signin');
  } catch {
    throw new Error(NEEDS_NEW_APK);
  }
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google;
  try {
    GoogleSignin.configure({ webClientId: env.googleWebClientId });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Cierra la sesión anterior de Google en la app para que siempre se pueda elegir la cuenta.
    await GoogleSignin.signOut().catch(() => undefined);
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null;
    }
    if (!response.data.idToken) {
      throw new Error('Google no entregó los datos de la cuenta. Intenta de nuevo.');
    }
    return response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return null;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Este celular no tiene Google Play Services actualizado.');
      }
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
      throw new Error('No se pudo iniciar sesión con Google. Intenta de nuevo.');
    }
    throw error;
  }
}

/** Microsoft con la página de inicio de sesión en una pestaña del navegador (OAuth con PKCE, sin secreto). */
async function microsoftIdToken(): Promise<string | null> {
  if (!env.microsoftClientId) {
    throw new Error('El inicio de sesión con Outlook aún no está configurado.');
  }
  const discovery = await AuthSession.fetchDiscoveryAsync(MICROSOFT_ISSUER);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'viadeep', path: MICROSOFT_REDIRECT_PATH });
  const request = new AuthSession.AuthRequest({
    clientId: env.microsoftClientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: { prompt: 'select_account' },
  });
  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') {
    if (result.type === 'error') {
      throw new Error(result.error?.message ?? 'No se pudo iniciar sesión con Outlook.');
    }
    return null;
  }
  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId: env.microsoftClientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : undefined,
    },
    discovery,
  );
  if (!tokens.idToken) {
    throw new Error('Outlook no entregó los datos de la cuenta. Intenta de nuevo.');
  }
  return tokens.idToken;
}
