import { z } from 'zod';
import { getLocalValue, updateLocalValue } from './local-database';
import { createRoutineRequestSchema, routineSchema, type CreateRoutineRequest, type Routine } from '../../types/api/routines';

// Cola de salida (outbox) para creaciones de rutina hechas sin conexión — continúa el storage
// de la Semana 12 (preferences.ts / secureToken.ts). El repositorio la drena cuando vuelve la
// conectividad (ver hooks/useNetworkStatus.ts); nunca se procesa sola en background.
const OUTBOX_KEY = 'pasitos_magicos_routines_outbox';

export interface OutboxEntry {
  localId: string;
  request: CreateRoutineRequest;
  createdAt: string;
  attempts: number;
  lastAttemptAt: string | null;
  reminderAt?: string;
  remoteRoutine?: Routine;
  uncertain?: boolean;
}

const entriesSchema = z.array(z.object({
  localId: z.string(), request: createRoutineRequestSchema, createdAt: z.string(),
  attempts: z.number().int().nonnegative(), lastAttemptAt: z.string().nullable(),
  reminderAt: z.string().datetime().optional(), remoteRoutine: routineSchema.optional(),
  uncertain: z.boolean().optional(),
}));
const parseEntries = (raw: string | null): OutboxEntry[] => raw ? entriesSchema.parse(JSON.parse(raw)) : [];

const readOutbox = async (): Promise<OutboxEntry[]> => {
  return parseEntries(await getLocalValue(OUTBOX_KEY));
};

const updateOutbox = async (change: (entries: OutboxEntry[]) => OutboxEntry[]): Promise<void> =>
  updateLocalValue(OUTBOX_KEY, raw => JSON.stringify(change(parseEntries(raw))));

export const enqueueRoutineCreation = async (request: CreateRoutineRequest, reminderAt?: string): Promise<OutboxEntry> => {
  const entry: OutboxEntry = { localId: crypto.randomUUID(), request, createdAt: new Date().toISOString(), attempts: 0, lastAttemptAt: null, reminderAt };
  entriesSchema.parse([entry]);
  await updateOutbox(entries => [...entries, entry]);
  return entry;
};

export const listOutboxEntries = async (): Promise<OutboxEntry[]> => readOutbox();

export const removeOutboxEntry = async (localId: string): Promise<void> => {
  await updateOutbox(entries => entries.filter(entry => entry.localId !== localId));
};

export const updateOutboxEntry = async (localId: string, patch: Partial<Pick<OutboxEntry, 'attempts' | 'lastAttemptAt' | 'remoteRoutine' | 'uncertain'>>): Promise<void> => {
  await updateOutbox(entries => entries.map(entry => entry.localId === localId ? { ...entry, ...patch } : entry));
};
