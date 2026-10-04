import { apiClient } from '../apiClient';
import { env } from '../../../config/env';
import type { ApiSuccessEnvelope } from '../../../types/api/common';
import type { MobileRegistrationRequest, MobileTokenResponse, RefreshResponse, SessionUser } from '../../../types/api/auth';
import { sessionUserSchema } from '../../../types/api/auth';

// GET /api/auth/login es una redirección de navegador (Keycloak), nunca una llamada Axios —
// ver spec/constitution/api-integration.md §2.
export const buildLoginUrl = (): string => `${env.apiBaseUrl}/auth/login`;

export const redirectToLogin = (): void => {
  window.location.assign(buildLoginUrl());
};

export const getSession = async (signal?: AbortSignal): Promise<SessionUser> => {
  const { data } = await apiClient.get<ApiSuccessEnvelope<SessionUser>>('/auth/session', { signal });
  return sessionUserSchema.parse(data.data);
};

// El contrato real hoy responde 204 sin cuerpo (flujo cookie/web). Se deja preparado para el
// caso en que el backend adopte el cuerpo `{ data: { sessionToken, expiresAt } }` también para
// el flujo Bearer/nativo (propuesta pendiente, ver api-integration.md) — si no hay cuerpo,
// devuelve `null` y el interceptor de renovación asume que el token sigue vigente.
export const refreshSession = async (): Promise<RefreshResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<RefreshResponse> | undefined>('/auth/refresh');
  return data?.data ?? null;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

// Auth nativa (feature 003) — formulario propio de usuario/contraseña, sin navegador externo.
// El backend habla con Keycloak por detrás (Resource Owner Password Credentials, solo para el
// cliente público configurado para la autenticación móvil — ver la feature 003.
export const loginWithPassword = async (username: string, password: string): Promise<MobileTokenResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<MobileTokenResponse>>('/auth/mobile/login', {
    username,
    password,
  });
  return data.data;
};

export const registerWithPassword = async (
  request: MobileRegistrationRequest,
): Promise<MobileTokenResponse> => {
  const { data } = await apiClient.post<ApiSuccessEnvelope<MobileTokenResponse>>('/auth/mobile/register', request);
  return data.data;
};
