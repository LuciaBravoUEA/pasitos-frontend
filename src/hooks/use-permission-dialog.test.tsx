import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIonAlert } from '@ionic/react';
import { usePermissionDialog } from './use-permission-dialog';

vi.mock('@ionic/react', () => ({ useIonAlert: vi.fn() }));

describe('explicación de permiso', () => {
  it('cerrar por fuera o con Atrás resuelve como cancelación', async () => {
    const present = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useIonAlert).mockReturnValue([present, vi.fn()]);
    const { result } = renderHook(usePermissionDialog);
    const answer = result.current('Usar cámara');
    present.mock.calls[0][0].onDidDismiss({ detail: { role: 'backdrop' } });
    expect(await answer).toBe(false);
  });

  it('acepta solo cuando termina de cerrarse la explicación con Continuar', async () => {
    const present = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useIonAlert).mockReturnValue([present, vi.fn()]);
    const { result } = renderHook(usePermissionDialog);
    const resolved = vi.fn();
    const answer = result.current('Usar cámara').then(resolved);
    await Promise.resolve();
    expect(resolved).not.toHaveBeenCalled();
    const options = present.mock.calls[0][0];
    expect(options.buttons).toContainEqual({ text: 'Continuar', role: 'confirm' });
    options.onDidDismiss({ detail: { role: 'confirm' } });
    await answer;
    expect(resolved).toHaveBeenCalledWith(true);
  });

  it('un fallo al presentar el diálogo no deja la operación esperando', async () => {
    vi.mocked(useIonAlert).mockReturnValue([vi.fn().mockRejectedValue(new Error('overlay')), vi.fn()]);
    const { result } = renderHook(usePermissionDialog);
    expect(await result.current('Usar cámara')).toBe(false);
  });
});
