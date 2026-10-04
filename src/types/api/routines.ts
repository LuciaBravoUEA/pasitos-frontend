import { z } from 'zod';

export const ROUTINE_CATEGORIES = ['ESCUELA', 'HOGAR', 'CALMA', 'AUTOCUIDADO'] as const;
export type RoutineCategory = (typeof ROUTINE_CATEGORIES)[number];

// Schema generado (Zod) = fuente única de verdad para el tipo y la validación/serialización
// en tiempo de ejecución (parse/safeParse), en vez de mantener una interface manual aparte.
// Ningún campo diverge de nombre con `GET/POST /api/rutinas` (ver api-integration.md §9) —
// se deja el patrón `// divergencia:` documentado por si el backend renombra un campo.
export const routineSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  // divergencia: ninguna hoy; el backend ya envía `description: string | null` (nunca `undefined`).
  description: z.string().nullable(),
  category: z.enum(ROUTINE_CATEGORIES),
  points: z.number(),
  completed: z.boolean(),
  createdAt: z.string(),
});

export type Routine = z.infer<typeof routineSchema>;

export const routineTaskSchema = z.object({ id: z.string(), title: z.string(), description: z.string().nullable(), position: z.number() });
export const routineDetailSchema = routineSchema.extend({ tasks: z.array(routineTaskSchema) });
export type RoutineDetail = z.infer<typeof routineDetailSchema>;

export const createRoutineRequestSchema = z.object({
  title: z.string().min(1),
  // Opcional en el request: el backend lo acepta ausente y lo persiste como `null`.
  description: z.string().optional(),
  category: z.enum(ROUTINE_CATEGORIES),
  points: z.number().int().positive(),
  tasks: z.array(z.string().trim().min(2).max(80)).min(1).max(20).optional(),
});

export type CreateRoutineRequest = z.infer<typeof createRoutineRequestSchema>;
