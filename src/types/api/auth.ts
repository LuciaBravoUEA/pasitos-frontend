import { z } from 'zod';

export const roleSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});
export type RoleSummary = z.infer<typeof roleSummarySchema>;

export const permissionSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
});
export type PermissionSummary = z.infer<typeof permissionSummarySchema>;

// Segunda entidad con serialización generada (Zod) — ver spec/features/010-*/plan.md §3.
// Sin divergencias de nombre hoy contra `GET /api/auth/session` (ver api-integration.md §2).
export const sessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  roles: z.array(roleSummarySchema),
  permissions: z.array(permissionSummarySchema),
  // El backend local expone expiración UNIX; las sesiones históricas de desarrollo pueden omitirla.
  exp: z.number().optional(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

// Respuesta del login móvil — ver feature 003.
export const mobileTokenResponseSchema = z.object({
  sessionToken: z.string(),
  expiresAt: z.string(),
});
export type MobileTokenResponse = z.infer<typeof mobileTokenResponseSchema>;

// `POST /api/auth/refresh` (flujo Bearer/nativo) devuelve hoy `204` sin cuerpo — contrato
// pensado originalmente solo para el flujo cookie/web (ver api-integration.md, registro de
// cambios 2026-09-19). Se modela el cuerpo esperado como opcional/anulable para que el cliente
// lo consuma SOLO si el backend llega a implementarlo; nunca se asume presente.
export const refreshResponseSchema = z
  .object({
    sessionToken: z.string(),
    expiresAt: z.string(),
  })
  .nullable()
  .optional();
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export interface MobileRegistrationRequest {
  role?: 'estudiante' | 'padre_familia' | 'docente';
  name: string;
  username: string;
  email: string;
  password: string;
}
