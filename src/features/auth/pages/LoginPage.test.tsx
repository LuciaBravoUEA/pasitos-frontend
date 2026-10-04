import { Capacitor } from '@capacitor/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

vi.mock('../../../services/api/endpoints/auth', () => ({
  loginWithPassword: vi.fn(),
  redirectToLogin: vi.fn(),
}));

vi.mock('../../../services/storage/secureToken', () => ({
  setSessionToken: vi.fn(),
}));

const wrapper = ({ children }: PropsWithChildren): React.ReactElement => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LoginPage', () => {
  it('shows the native credential form with accessible labels', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    const { container } = render(<LoginPage />, { wrapper });

    expect(screen.getByRole('heading', { name: 'Pasitos Mágicos' })).toBeInTheDocument();
    expect(screen.getByText('Acompañamos cada paso para que la rutina sea más fácil, alegre y motivadora.')).toBeInTheDocument();
    expect(container.querySelector('ion-input[label="Usuario"]')).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(container.querySelector('ion-button[type="submit"]')).toHaveTextContent('Iniciar sesión');
  });

  it('identifies required fields when the native form is submitted empty', async () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    const { container } = render(<LoginPage />, { wrapper });
    const form = container.querySelector('form');

    expect(form).not.toBeNull();
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(container.querySelector('ion-input[label="Usuario"]')).toHaveAttribute('error-text', 'El usuario es obligatorio');
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });
  });

  it('keeps the web login free of credential fields', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false);

    const { container } = render(<LoginPage />, { wrapper });

    expect(container.querySelector('ion-button')).toHaveTextContent('Continuar');
    expect(container.querySelector('ion-input[label="Usuario"]')).not.toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).not.toBeInTheDocument();
  });
});
