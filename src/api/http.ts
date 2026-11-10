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

/** Error con un mensaje listo para mostrar al usuario. network es true si no hubo respuesta del servidor. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly network = false,
    /** Código del backend para casos que la app trata aparte, por ejemplo EMAIL_NOT_VERIFIED. */
    readonly code?: string,
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
      return new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', undefined, true);
    }
    const status = error.response.status;
    const data = error.response.data as { detail?: string; code?: string } | undefined;
    // Un error con código propio (o un 429 con la espera) trae su mensaje exacto en detail.
    const specific = (data?.code || status === 429) && data?.detail ? data.detail : undefined;
    return new ApiError(
      specific ?? MESSAGES_BY_STATUS[status] ?? data?.detail ?? 'Ocurrió un error inesperado.',
      status,
      false,
      data?.code,
    );
  }
  return new ApiError('Ocurrió un error inesperado.');
}

/** true si la operación falló porque no hubo conexión con el servidor (y no porque el servidor la rechazó). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.network;
}
