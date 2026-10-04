import { describe, expect, it, vi } from 'vitest';
import { logger, redactEmail } from './logger';

describe('logger', () => {
  it('redacts an email keeping only the first character and domain', () => {
    expect(redactEmail('paul.leones@dominio.com')).toBe('p***@dominio.com');
  });

  it('redacts sensitive context keys before logging', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('fallo de login', { token: 'secret-value', email: 'paul.leones@dominio.com' });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        token: '[REDACTED]',
        email: 'p***@dominio.com',
      }),
    );

    spy.mockRestore();
  });
});
