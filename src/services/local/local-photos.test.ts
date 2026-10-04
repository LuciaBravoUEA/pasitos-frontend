import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLocalDatabase } from './local-database';
import { loadLocalPhoto, saveLocalPhoto } from './local-photos';
import { readLocalPhoto } from '../api/local-photo';

vi.mock('../storage/preferences', () => ({ getPreference: vi.fn().mockResolvedValue(null), removePreference: vi.fn() }));
vi.mock('../api/local-photo', () => ({ readLocalPhoto: vi.fn() }));
beforeEach(async () => { vi.clearAllMocks(); await clearLocalDatabase(); });

describe('copia persistente de fotos', () => {
  it('puede recuperar la imagen aunque el archivo temporal ya no exista', async () => {
    vi.mocked(readLocalPhoto).mockResolvedValue('data:image/png;base64,aW1hZ2Vu');
    await saveLocalPhoto('photo', 'http://localhost/_capacitor_file_/temporary.png');
    vi.mocked(readLocalPhoto).mockRejectedValue(new Error('deleted'));
    expect(await loadLocalPhoto('photo')).toBe('data:image/png;base64,aW1hZ2Vu');
    expect(readLocalPhoto).toHaveBeenCalledTimes(1);
  });

  it('conserva la foto anterior si la nueva no se puede copiar', async () => {
    vi.mocked(readLocalPhoto).mockResolvedValueOnce('data:image/png;base64,anterior');
    await saveLocalPhoto('photo', 'old');
    vi.mocked(readLocalPhoto).mockRejectedValueOnce(new Error('full'));
    await expect(saveLocalPhoto('photo', 'new')).rejects.toThrow();
    expect(await loadLocalPhoto('photo')).toBe('data:image/png;base64,anterior');
  });
});
