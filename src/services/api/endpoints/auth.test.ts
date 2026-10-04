import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../apiClient';
import { logout } from './auth';

vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('auth endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes the server session through the logout endpoint', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });

    await logout();

    expect(apiClient.post).toHaveBeenCalledOnce();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });
});
