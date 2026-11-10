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

  it('conserva el código y el mensaje del backend para casos especiales', () => {
    const error = toApiError(
      httpError(403, { detail: 'Confirma tu correo con el código que te enviamos', code: 'EMAIL_NOT_VERIFIED' }),
    );

    expect(error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(error.message).toBe('Confirma tu correo con el código que te enviamos');
    expect(toApiError(httpError(429, { detail: 'Espera 42 segundos antes de pedir otro código' })).message).toMatch('42');
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
