import { env } from '@/config/env';

import { createClient, toApiError } from './http';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: 'CITIZEN' | 'OPERATOR';
  phone: string | null;
  /** DNI */
  documentNumber: string | null;
};

export type ProfileChanges = { fullName: string; phone: string; documentNumber: string };

const client = createClient(env.authUrl);

export const authApi = {
  async login(email: string, password: string): Promise<string> {
    try {
      const { data } = await client.post<{ accessToken: string }>('/auth/login', { email, password });
      return data.accessToken;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 401) {
        throw new Error('Correo o contraseña incorrectos.');
      }
      throw apiError;
    }
  },

  /** Crea la cuenta pendiente; el backend envía un código de 6 dígitos al correo. */
  async register(fullName: string, email: string, password: string): Promise<void> {
    try {
      await client.post('/auth/register', { fullName, email, password });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 409) {
        throw new Error('Ya existe una cuenta con ese correo.');
      }
      throw apiError;
    }
  },

  /** Entra con el token de identidad de Google o Microsoft; si el correo no tiene cuenta, el backend la crea. */
  async socialLogin(provider: 'google' | 'microsoft', idToken: string): Promise<string> {
    try {
      const { data } = await client.post<{ accessToken: string }>(`/auth/${provider}`, { idToken });
      return data.accessToken;
    } catch (error) {
      // 401 token no válido, 403 cuenta de operador o desactivada, 503 proveedor sin configurar: traen su mensaje.
      throw toApiError(error);
    }
  },

  /** Confirma el correo con el código y devuelve el token de la sesión, como el login. */
  async verifyEmail(email: string, code: string): Promise<string> {
    try {
      const { data } = await client.post<{ accessToken: string }>('/auth/email/verify', { email, code });
      return data.accessToken;
    } catch (error) {
      // 422 trae "El código no es correcto", "El código venció..." o "Demasiados intentos...".
      throw toApiError(error);
    }
  },

  async resendVerification(email: string): Promise<void> {
    try {
      await client.post('/auth/email/resend', { email });
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** El backend responde igual exista o no la cuenta, para no revelar qué correos están registrados. */
  async forgotPassword(email: string): Promise<void> {
    try {
      await client.post('/auth/password/forgot', { email });
    } catch (error) {
      throw toApiError(error);
    }
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await client.post('/auth/password/reset', { email, code, newPassword });
    } catch (error) {
      throw toApiError(error);
    }
  },

  async me(token: string): Promise<User> {
    try {
      const { data } = await client.get<User>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Usa el token de la sesión (lo agrega el cliente HTTP). */
  async updateProfile(changes: ProfileChanges): Promise<User> {
    try {
      const { data } = await client.put<User>('/auth/me', changes);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await client.put('/auth/me/password', { currentPassword, newPassword });
    } catch (error) {
      // 422 trae el mensaje "La contraseña actual no es correcta".
      throw toApiError(error);
    }
  },
};
