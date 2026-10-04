import type { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { AuthorizationError, BusinessRuleError, NotFoundError, ServerError, UnknownError, getUserErrorMessage, mapApiError } from './errorMapper';
import type { ApiErrorBody } from '../../types/api/common';

// Cobertura reveló que `buildFromBackendCode` nunca ejercitaba las ramas FORBIDDEN, NOT_FOUND,
// CONFLICT, INTERNAL_ERROR/METHOD_NOT_ALLOWED ni el `default` (código desconocido) — solo
// VALIDATION_ERROR y UNAUTHORIZED tenían prueba. Este archivo cierra esas ramas sin tocar
// errorMapper.test.ts, que ya existía.
const buildAxiosError = (code: string | undefined, status: number): AxiosError<ApiErrorBody> =>
  ({
    isAxiosError: true,
    name: 'AxiosError',
    message: 'mock',
    toJSON: () => ({}),
    response: { status, data: { error: { code, message: 'detalle backend' } } } as AxiosError<ApiErrorBody>['response'],
  }) as AxiosError<ApiErrorBody>;

describe('buildFromBackendCode — ramas restantes', () => {
  it('maps FORBIDDEN to AuthorizationError', () => {
    expect(mapApiError(buildAxiosError('FORBIDDEN', 403))).toBeInstanceOf(AuthorizationError);
  });

  it('maps NOT_FOUND to NotFoundError', () => {
    expect(mapApiError(buildAxiosError('NOT_FOUND', 404))).toBeInstanceOf(NotFoundError);
  });

  it('maps CONFLICT to BusinessRuleError', () => {
    expect(mapApiError(buildAxiosError('CONFLICT', 409))).toBeInstanceOf(BusinessRuleError);
  });

  it('maps INTERNAL_ERROR and METHOD_NOT_ALLOWED to ServerError', () => {
    expect(mapApiError(buildAxiosError('INTERNAL_ERROR', 500))).toBeInstanceOf(ServerError);
    expect(mapApiError(buildAxiosError('METHOD_NOT_ALLOWED', 405))).toBeInstanceOf(ServerError);
  });

  it('maps an undocumented code to UnknownError', () => {
    expect(mapApiError(buildAxiosError('ALGO_NUEVO', 418))).toBeInstanceOf(UnknownError);
  });

  it('translates every mapped code to a Spanish user message', () => {
    expect(getUserErrorMessage(new AuthorizationError('x'))).toBe('No tienes permiso para realizar esta acción.');
    expect(getUserErrorMessage(new NotFoundError('x'))).toBe('No encontramos la información solicitada.');
    expect(getUserErrorMessage(new BusinessRuleError('x'))).toBe('La información entra en conflicto con un registro existente.');
    expect(getUserErrorMessage(new ServerError('x'))).toBe('Ocurrió un problema en el servidor. Inténtalo más tarde.');
  });
});
