import { z } from 'zod';

export const companionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  role: z.enum(['padre_familia', 'docente']),
});
export const companionsAccountSchema = z.object({ username: z.string(), companions: z.array(companionSchema) });
export type Companion = z.infer<typeof companionSchema>;
