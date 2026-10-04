const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Solo lee la URL local entregada por el plugin; nunca envía imágenes a la API.
export const readLocalPhoto = async (webPath: string): Promise<string> => {
  const url = new URL(webPath, window.location.href);
  const localFile = url.origin === window.location.origin &&
    (url.pathname.startsWith('/_capacitor_file_') || url.pathname.startsWith('/_capacitor_content_'));
  const localBlob = url.protocol === 'blob:' && url.origin === window.location.origin;
  const inlineImage = /^data:image\/(jpeg|png|webp);base64,/i.test(webPath);
  if (!localFile && !localBlob && !inlineImage) throw new Error('Invalid local photo');
  const response = await fetch(webPath, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Photo unavailable');
  if (Number(response.headers.get('content-length')) > MAX_PHOTO_BYTES) throw new Error('Photo too large');
  const blob = await response.blob();
  if (blob.size > MAX_PHOTO_BYTES || !/^image\/(jpeg|png|webp)$/i.test(blob.type)) throw new Error('Unsupported photo');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid photo'));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};
