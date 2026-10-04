import { z } from 'zod';

export const companionSearchSchema = z.object({
  username: z.string().trim().min(1, 'Escribe el usuario del adulto').max(100, 'Usa hasta 100 caracteres'),
});
export type CompanionSearchValues = z.infer<typeof companionSearchSchema>;
