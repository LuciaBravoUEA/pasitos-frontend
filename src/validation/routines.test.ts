import { describe, expect, it } from 'vitest';
import { createRoutineSchema } from './routines';

describe('createRoutineSchema', () => {
  it('accepts the verified API contract', () => {
    expect(createRoutineSchema.safeParse({ title: 'Preparar mochila', description: '', category: 'HOGAR', points: 10 }).success).toBe(true);
  });

  it('provides corrective field messages', () => {
    const result = createRoutineSchema.safeParse({ title: '', category: 'OTRA', points: 0 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map(issue => issue.message)).toEqual(expect.arrayContaining(['Título: escribe al menos 2 caracteres.', 'Categoría: selecciona una opción disponible.', 'Puntos: el mínimo es 1.']));
  });
});
