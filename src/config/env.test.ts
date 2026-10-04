import { describe, expect, it } from 'vitest';
import { env } from './env';

describe('env', () => {
  it('exposes an apiBaseUrl read from VITE_API_BASE_URL', () => {
    expect(env.apiBaseUrl).toBeTruthy();
  });

  it('defaults apiTimeoutMs to a positive number', () => {
    expect(env.apiTimeoutMs).toBeGreaterThan(0);
  });
});
