import { create, AxiosError, isAxiosError, type AxiosInstance } from 'axios';

type SessionHooks = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

let hooks: SessionHooks = { getToken: () => null, onUnauthorized: () => {} };

/** La sesión registra aquí cómo leer el token y qué hacer si el backend responde 401. */
export function configureSession(next: SessionHooks) {
  hooks = next;
}

export function currentToken(): string | null {
  return hooks.getToken();
}

export function notifyUnauthorized() {
  hooks.onUnauthorized();
}

export function createClient(baseURL: string): AxiosInstance {
  const client = create({ baseURL, timeout: 15000 });
  client.interceptors.request.use((config) => {
    const token = hooks.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  client.interceptors.response.use(undefined, (error: AxiosError) => {
    if (error.response?.status === 401 && hooks.getToken()) {
      hooks.onUnauthorized();
    }
    return Promise.reject(error);
  });
  return client;
}

/** Error con un mensaje listo para mostrar al usuario. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MESSAGES_BY_STATUS: Record<number, string> = {
  401: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  403: 'No tienes permiso para esta acción.',
  409: 'Ese dato ya está registrado.',
  413: 'La foto es demasiado grande.',
  503: 'El servicio no está disponible. Intenta de nuevo en unos minutos.',
};

/** Convierte cualquier error de red o del backend (ProblemDetail) en un ApiError legible. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.');
    }
    const status = error.response.status;
    const data = error.response.data as { detail?: string } | undefined;
    return new ApiError(MESSAGES_BY_STATUS[status] ?? data?.detail ?? 'Ocurrió un error inesperado.', status);
  }
  return new ApiError('Ocurrió un error inesperado.');
}
