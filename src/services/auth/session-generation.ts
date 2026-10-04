let generation = 0;

export const getSessionGeneration = (): number => generation;

// Las respuestas de credenciales anteriores no deben invalidar una sesión recién iniciada.
export const beginSessionChange = (): void => { generation += 1; };
