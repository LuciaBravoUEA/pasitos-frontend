import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateRoutinePage from './CreateRoutinePage';
import { createRoutine } from '../../../services/repositories/routinesRepository';
import { saveReminderIntent } from '../../../services/local/reminder-intents';

const { ensurePermission } = vi.hoisted(() => ({ ensurePermission: vi.fn().mockResolvedValue(true) }));

vi.mock('../../../services/local/local-database', () => ({
  getLocalValue: vi.fn().mockResolvedValue(JSON.stringify({ title: 'Leer un cuento', description: '', category: 'HOGAR', points: 10 })),
  setLocalValue: vi.fn().mockResolvedValue(undefined), removeLocalValue: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../services/repositories/routinesRepository', () => ({ createRoutine: vi.fn().mockResolvedValue({ id: 'routine-1', title: 'Leer un cuento' }) }));
vi.mock('../../../services/device/notificationPermission', () => ({ isNotificationsCapabilityAvailable: () => true }));
vi.mock('../../../hooks/useNotificationReminderPermission', () => ({ useNotificationReminderPermission: () => ({ ensurePermission, degradationMessage: null, openSettings: vi.fn() }) }));
vi.mock('../../../services/local/reminder-intents', () => ({ saveReminderIntent: vi.fn().mockRejectedValue(new Error('storage full')), deliverReminderIntents: vi.fn() }));

describe('crear rutina con fallo opcional', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('pide permiso al activar el recordatorio sin guardar la rutina', async () => {
    const client = new QueryClient();
    const { container } = render(<QueryClientProvider client={client}><MemoryRouter><CreateRoutinePage /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(container.querySelector('ion-input[label="Título"]')).toHaveAttribute('value', 'Leer un cuento'));
    expect(ensurePermission).not.toHaveBeenCalled();
    fireEvent(container.querySelector('ion-checkbox')!, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));
    await waitFor(() => expect(ensurePermission).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(container.querySelector('ion-checkbox')).not.toHaveAttribute('disabled'));
    expect(createRoutine).not.toHaveBeenCalled();
    fireEvent(container.querySelector('ion-checkbox')!, new CustomEvent('ionChange', { detail: { checked: false }, bubbles: true }));
    expect(ensurePermission).toHaveBeenCalledTimes(1);
  });

  it('mantiene la rutina guardada y reintenta solo el aviso', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(<QueryClientProvider client={client}><MemoryRouter><CreateRoutinePage /></MemoryRouter></QueryClientProvider>);
    await waitFor(() => expect(container.querySelector('ion-input[label="Título"]')).toHaveAttribute('value', 'Leer un cuento'));
    fireEvent(container.querySelector('ion-checkbox')!, new CustomEvent('ionChange', { detail: { checked: true }, bubbles: true }));
    await waitFor(() => expect(container.querySelector('ion-checkbox')).not.toHaveAttribute('disabled'));
    fireEvent.submit(container.querySelector('form')!);
    await screen.findByText('La rutina está guardada, pero no se pudo guardar el aviso. Puedes reintentar solo el recordatorio.');
    expect(container.querySelector('form')).toBeNull();
    fireEvent.click(screen.getByText('Activar recordatorio mañana'));
    await waitFor(() => expect(saveReminderIntent).toHaveBeenCalledTimes(2));
    expect(createRoutine).toHaveBeenCalledTimes(1);
  });
});
