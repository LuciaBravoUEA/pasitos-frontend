import { Capacitor } from '@capacitor/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';
import { registerWithPassword } from '../../../services/api/endpoints/auth';
import { registrationFormSchema } from '../../../validation/auth';

vi.mock('../../../services/api/endpoints/auth', () => ({ registerWithPassword: vi.fn().mockResolvedValue({ sessionToken: 'test-token', expiresAt: '2026-10-02' }), loginWithPassword: vi.fn(), redirectToLogin: vi.fn() }));
vi.mock('../../../services/storage/secureToken', () => ({ setSessionToken: vi.fn().mockResolvedValue(undefined) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe('Registro con perfil', () => {
  it.each(['estudiante', 'padre_familia', 'docente'])('envía el perfil %s seleccionado', async role => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
    const { container } = render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={['/registro']}><LoginPage /></MemoryRouter></QueryClientProvider>);
    for (const [label, value] of [['Nombre', 'Prueba'], ['Usuario', 'prueba'], ['Correo', 'prueba@example.test']]) {
      fireEvent(container.querySelector('ion-input[label="' + label + '"]')!, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
    }
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'test123456' } });
    fireEvent(container.querySelector('ion-select')!, new CustomEvent('ionChange', { detail: { value: role }, bubbles: true }));
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(registerWithPassword).toHaveBeenCalledWith(expect.objectContaining({ role, username: 'prueba' })));
  });

  it('rechaza perfiles arbitrarios y mantiene compatibilidad con registro sin role', () => {
    const input = { name: 'Prueba', username: 'prueba', email: 'prueba@example.test', password: 'test123456' };
    expect(registrationFormSchema.safeParse({ ...input, role: 'admin' }).success).toBe(false);
    expect(registrationFormSchema.safeParse(input).success).toBe(true);
  });
});
