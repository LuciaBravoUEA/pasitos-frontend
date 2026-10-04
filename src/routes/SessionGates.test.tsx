import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedGate } from './SessionGates';

vi.mock('../features/auth/hooks/useSession', () => ({
  useSession: () => ({ isPending: false, isError: true, isSuccess: false }),
}));

const CurrentLocation: React.FC = () => {
  const location = useLocation();
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>;
};

describe('ProtectedGate', () => {
  it('does not create a redirect loop when an Ionic-retained gate observes login', async () => {
    render(
      <MemoryRouter initialEntries={['/login?returnTo=%2Fhome']}>
        <ProtectedGate><p>protected</p></ProtectedGate>
        <CurrentLocation />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login?returnTo=%2Fhome');
    });
  });

  it('redirects a private destination to login once', async () => {
    render(
      <MemoryRouter initialEntries={['/rutinas?page=2']}>
        <ProtectedGate><p>protected</p></ProtectedGate>
        <CurrentLocation />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login?returnTo=%2Frutinas%3Fpage%3D2');
    });
  });
});
