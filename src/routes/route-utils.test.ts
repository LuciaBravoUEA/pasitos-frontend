import { describe, expect, it } from 'vitest';
import { buildLoginRedirect, sanitizeReturnTo } from './route-utils';

describe('route utils', () => {
  it('preserves an internal routine destination', () => {
    expect(sanitizeReturnTo('/rutinas/11111111-1111-4111-8111-111111111111')).toBe('/rutinas/11111111-1111-4111-8111-111111111111');
    expect(buildLoginRedirect('/rutinas', '?page=2')).toBe('/login?returnTo=%2Frutinas%3Fpage%3D2');
  });

  it('rejects external or unknown destinations', () => {
    expect(sanitizeReturnTo('https://example.com')).toBe('/home');
    expect(sanitizeReturnTo('//example.com')).toBe('/home');
    expect(sanitizeReturnTo('/admin')).toBe('/home');
  });
});
