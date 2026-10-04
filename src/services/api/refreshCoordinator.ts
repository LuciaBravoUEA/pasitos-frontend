// Coalesce varias renovaciones de sesión simultáneas (varias peticiones que expiran a la vez)
// en una única llamada real a /auth/refresh. Todas esperan la misma promesa; ninguna dispara
// una renovación adicional mientras una ya está en curso.
let refreshPromise: Promise<void> | null = null;

export const coordinateRefresh = (refreshFn: () => Promise<void>): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = refreshFn().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};
