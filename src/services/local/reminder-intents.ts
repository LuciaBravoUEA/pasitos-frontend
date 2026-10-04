import { z } from 'zod';
import { getLocalValue, updateLocalValue, localOwner } from './local-database';
import { scheduleRoutineReminder } from '../device/routineReminders';

const KEY = 'routine_reminder_intents';
const schema = z.array(z.object({ id: z.string(), title: z.string(), at: z.string().datetime() }));
type ReminderIntent = z.infer<typeof schema>[number];
const parse = (raw: string | null): ReminderIntent[] => raw ? schema.parse(JSON.parse(raw)) : [];

export const listReminderIntents = async (): Promise<ReminderIntent[]> => parse(await getLocalValue(KEY));
export const removeReminderIntent = async (id: string): Promise<void> =>
  updateLocalValue(KEY, raw => JSON.stringify(parse(raw).filter(item => item.id !== id)));

export const saveReminderIntent = async (routine: { id: string; title: string }, at: string): Promise<void> => {
  const intent = { id: routine.id, title: routine.title, at };
  schema.parse([intent]);
  await updateLocalValue(KEY, raw => JSON.stringify([...parse(raw).filter(item => item.id !== routine.id), intent]));
};

export const deliverReminderIntents = async (): Promise<number> => {
  const owner = localOwner();
  const intents = parse(await getLocalValue(KEY, owner));
  let pending = 0;
  for (const intent of intents) {
    if (localOwner() !== owner) break;
    try {
      // El arranque/resume solo comprueba permisos: nunca presenta diálogos del sistema.
      await scheduleRoutineReminder(intent, new Date(intent.at));
      await updateLocalValue(KEY, raw => JSON.stringify(parse(raw).filter(item => item.id !== intent.id || item.at !== intent.at)), owner);
    } catch {
      pending += 1;
    }
  }
  return pending;
};
