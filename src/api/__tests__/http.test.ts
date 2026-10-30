import { AxiosError, AxiosHeaders } from 'axios';

import { ApiError, isNetworkError, toApiError } from '@/api/http';

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('fallo', 'ERR', config, null, { status, statusText: '', data, headers: {}, config });
}

describe('toApiError', () => {
  it('usa el detalle del ProblemDetail del backend', () => {
    const error = toApiError(httpError(422, { detail: 'La evidencia ya fue usada' }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('La evidencia ya fue usada');
    expect(error.status).toBe(422);
  });

  it('da un mensaje propio para servicios caídos', () => {
    expect(toApiError(httpError(503, { detail: 'x' })).message).toMatch('no está disponible');
  });

  it('reconoce la falta de conexión', () => {
    expect(toApiError(new AxiosError('Network Error')).message).toMatch('No se pudo conectar');
  });

  it('distingue la falta de conexión de un rechazo del servidor', () => {
    expect(isNetworkError(toApiError(new AxiosError('Network Error')))).toBe(true);
    expect(isNetworkError(toApiError(httpError(400, { detail: 'Datos inválidos' })))).toBe(false);
    expect(isNetworkError(new Error('otro'))).toBe(false);
  });
});
