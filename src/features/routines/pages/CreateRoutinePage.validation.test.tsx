import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateRoutinePage from './CreateRoutinePage';
import { createRoutine } from '../../../services/repositories/routinesRepository';
import { ValidationError } from '../../../services/api/errorMapper';

vi.mock('../../../services/storage/preferences', () => ({
  getPreference: vi.fn().mockResolvedValue(null),
  setPreference: vi.fn().mockResolvedValue(undefined),
  removePreference: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../services/repositories/routinesRepository', () => ({ createRoutine: vi.fn() }));
vi.mock('../../../services/device/notificationPermission', () => ({ isNotificationsCapabilityAvailable: () => false }));
vi.mock('../../../hooks/useNotificationReminderPermission', () => ({
  useNotificationReminderPermission: () => ({ ensurePermission: vi.fn(), degradationMessage: null, openSettings: vi.fn() }),
}));
vi.mock('../../../services/local/reminder-intents', () => ({ saveReminderIntent: vi.fn(), deliverReminderIntents: vi.fn() }));

const renderPage = (): ReturnType<typeof render> => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><CreateRoutinePage /></MemoryRouter></QueryClientProvider>);
};

describe('CreateRoutinePage — validación de formulario', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('impide el envío con un título inválido y nunca llama al repositorio', async () => {
    const { container } = renderPage();

    fireEvent(container.querySelector('ion-input[label="Título"]')!, new CustomEvent('ionInput', { detail: { value: 'a' }, bubbles: true }));
    fireEvent(container.querySelector('ion-input[label="Título"]')!, new CustomEvent('ionBlur', { bubbles: true }));
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(container.querySelector('ion-input[label="Título"]')).toHaveAttribute('error-text', 'Título: escribe al menos 2 caracteres.'));
    expect(createRoutine).not.toHaveBeenCalled();
  });

  it('asocia un error de validación devuelto por el servidor al campo correspondiente', async () => {
    vi.mocked(createRoutine).mockRejectedValue(
      new ValidationError('Datos inválidos', 422, [{ field: 'title', message: 'Ese título ya existe' }]),
    );
    const { container } = renderPage();

    fireEvent(container.querySelector('ion-input[label="Título"]')!, new CustomEvent('ionInput', { detail: { value: 'Rutina repetida' }, bubbles: true }));
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(container.querySelector('ion-input[label="Título"]')).toHaveAttribute('error-text', 'Ese título ya existe'));
    // El error de servidor se asocia al campo — nunca se muestra además como mensaje genérico.
    expect(screen.queryByText('Ocurrió un error inesperado. Intenta nuevamente.')).toBeNull();
  });

  // Bug reproducido: un 422 con un campo que el formulario no mapea (p. ej. uno que no existe
  // en FIELD_NAMES) se perdía en silencio — ni el campo ni ningún mensaje general se mostraban.
  it('muestra un mensaje visible cuando el error de validación llega en un campo no mapeado', async () => {
    vi.mocked(createRoutine).mockRejectedValue(
      new ValidationError('Datos inválidos', 422, [{ field: 'ownerId', message: 'El propietario no es válido' }]),
    );
    const { container } = renderPage();

    fireEvent(container.querySelector('ion-input[label="Título"]')!, new CustomEvent('ionInput', { detail: { value: 'Preparar mochila' }, bubbles: true }));
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(screen.getByText('Revisa los datos marcados e inténtalo nuevamente.')).toBeInTheDocument());
  });
});
