import { z } from 'zod';
import { ROUTINE_CATEGORIES } from '../types/api/routines';

export const createRoutineSchema = z.object({
  title: z.string().trim().min(2, 'Título: escribe al menos 2 caracteres.').max(80, 'Título: usa como máximo 80 caracteres.'),
  description: z.string().trim().max(240, 'Descripción: usa como máximo 240 caracteres.').optional(),
  category: z.enum(ROUTINE_CATEGORIES, { message: 'Categoría: selecciona una opción disponible.' }),
  points: z.number().int('Puntos: escribe un número entero.').min(1, 'Puntos: el mínimo es 1.').max(100, 'Puntos: el máximo es 100.'),
});

export type CreateRoutineFormValues = z.infer<typeof createRoutineSchema>;

export const taskFormSchema = z.object({ title: z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(80, 'Usa como máximo 80 caracteres.') });
export const routineWithTasksSchema = createRoutineSchema.extend({
  tasksText: z.string().optional().refine(value => !value?.trim() || (value.trim().split('\n').length <= 20 && value.trim().split('\n').every(line => line.trim().length >= 2 && line.trim().length <= 80)), 'Escribe de 1 a 20 pasos, uno por línea, con 2 a 80 caracteres cada uno.'),
});
export type RoutineWithTasksValues = z.infer<typeof routineWithTasksSchema>;
