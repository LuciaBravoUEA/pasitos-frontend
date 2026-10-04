import { describe, expect, it } from 'vitest';
import { loginFormSchema } from './auth';

describe('loginFormSchema', () => {
  it('accepts a valid username/password pair', () => {
    const result = loginFormSchema.safeParse({ username: 'estudiante.ejemplo', password: 'EXAMPLE_DATABASE_PASSWORD' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty username', () => {
    const result = loginFormSchema.safeParse({ username: '', password: 'EXAMPLE_DATABASE_PASSWORD' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginFormSchema.safeParse({ username: 'estudiante.ejemplo', password: '' });
    expect(result.success).toBe(false);
  });
});
