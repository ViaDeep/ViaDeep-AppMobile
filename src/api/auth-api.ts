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
