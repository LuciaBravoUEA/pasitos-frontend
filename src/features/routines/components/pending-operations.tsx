import { useEffect, useState } from 'react';
import { useIonViewWillEnter } from '@ionic/react';
import { useQueryClient } from '@tanstack/react-query';
import AppButton from '../../../components/common/AppButton';
import { useNotificationReminderPermission } from '../../../hooks/useNotificationReminderPermission';
import { listReminderIntents, removeReminderIntent, saveReminderIntent, deliverReminderIntents } from '../../../services/local/reminder-intents';
import { listOutboxEntries, updateOutboxEntry } from '../../../services/local/outboxQueue';
import { syncOutbox } from '../../../services/repositories/routinesRepository';
import { cancelRoutineReminder } from '../../../services/device/routineReminders';
import { useSyncStatusStore } from '../../../store/sync-status-store';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useOfflineStatus } from '../../../store/offline-status';

export const PendingOperations: React.FC = () => {
  const [reminders, setReminders] = useState<Awaited<ReturnType<typeof listReminderIntents>>>([]);
  const [count, setCount] = useState(0);
  const [uncertain, setUncertain] = useState(false);
  const [confirmRetry, setConfirmRetry] = useState(false);
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const status = useSyncStatusStore(state => state.message);
  const permission = useNotificationReminderPermission();
  const queryClient = useQueryClient();
  const reload = async (): Promise<void> => {
    try {
      const [pending, entries] = await Promise.all([listReminderIntents(), listOutboxEntries()]);
      setReminders(pending);
      setCount(entries.length);
      setUncertain(entries.some(entry => entry.uncertain));
    } catch { setMessage('No se pudieron leer las operaciones guardadas. Revisa el espacio disponible.'); }
  };
  useEffect(() => { void reload(); }, [status]);
  useIonViewWillEnter(() => { void reload(); });
  const run = async (operation: () => Promise<void>): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try { await operation(); } catch { setMessage('No se pudo completar esta acción. La rutina sigue disponible y puedes intentarlo de nuevo.'); }
    finally { await reload(); setBusy(false); }
  };
  const retry = async (): Promise<void> => {
    const entries = await listOutboxEntries();
    for (const entry of entries) await updateOutboxEntry(entry.localId, { attempts: 0, uncertain: false });
    const result = await syncOutbox();
    await queryClient.invalidateQueries({ queryKey: ['routines'] });
    setMessage(result.failed ? 'Hay rutinas que siguen pendientes. Comprueba tu conexión.' : 'Sincronización completada.');
  };
  return <section aria-label="Operaciones pendientes">
    {count > 0 && <p role="status">{count} rutina(s) guardada(s) pendientes de sincronización. <AppButton disabled={busy || !online || offline} onClick={() => uncertain ? setConfirmRetry(true) : void run(retry)}>Sincronizar pendientes</AppButton></p>}
    {uncertain && <p>Una creación quedó sin respuesta. Revisa tus rutinas guardadas antes de reintentar: podría haberse guardado en el servidor.</p>}
    {confirmRetry && <section role="alertdialog" aria-label="Confirmar reintento de creación">
      <p>Reintentar puede crear una rutina duplicada si el servidor ya la guardó. Comprueba la lista antes de continuar.</p>
      <AppButton variant="secondary" onClick={() => setConfirmRetry(false)}>Cancelar</AppButton>
      <AppButton disabled={busy || !online || offline} onClick={() => { setConfirmRetry(false); void run(retry); }}>Confirmar reintento</AppButton>
    </section>}
    {reminders.map(reminder => <div key={reminder.id}>
      <p>{reminder.title}: {Date.parse(reminder.at) <= Date.now() ? 'la fecha del aviso ya pasó' : 'recordatorio pendiente de activar'}.</p>
      <AppButton disabled={busy} onClick={() => void run(async () => {
        if (!await permission.ensurePermission()) return;
        const at = new Date(); at.setDate(at.getDate() + 1); at.setHours(9, 0, 0, 0);
        await saveReminderIntent(reminder, at.toISOString());
        const remaining = await deliverReminderIntents();
        setMessage(remaining ? 'Hay avisos que no pudieron activarse. Revisa los ajustes de notificaciones.' : 'Recordatorio activado para mañana.');
      })}>Activar mañana</AppButton>
      <AppButton variant="ghost" disabled={busy} onClick={() => void run(async () => {
        await cancelRoutineReminder(reminder.id);
        await removeReminderIntent(reminder.id);
      })}>Descartar aviso</AppButton>
    </div>)}
    {(permission.degradationMessage || reminders.length > 0) && <AppButton variant="ghost" onClick={() => void permission.openSettings()}>Abrir ajustes de notificaciones</AppButton>}
    {permission.degradationMessage && <p role="status">{permission.degradationMessage}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
};
