import { useOfflineStatus } from '../../../store/offline-status';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import type { RoutineDetail } from '../../../types/api/routines';
import { taskFormSchema } from '../../../validation/routines';
import { getUserErrorMessage } from '../../../services/api/errorMapper';
import { useRoutineChanges } from '../hooks/useRoutines';
import { RoutineEditor } from './routine-editor';
import { useSessionStore } from '../../../store/sessionStore';

export const RoutineActions: React.FC<{ routine: RoutineDetail }> = ({ routine }) => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const history = useHistory();
  const canManage = useSessionStore(state => state.user?.permissions.some(permission => permission.code === 'rutinas.manage'));
  const changes = useRoutineChanges(routine.id);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ title: string }>({ resolver: zodResolver(taskFormSchema), defaultValues: { title: '' } });
  const busy = !online || offline || changes.update.isPending || changes.addTask.isPending || changes.remove.isPending;
  const remove = async (): Promise<void> => {
    setMessage(null);
    try {
      await changes.remove.mutateAsync();
      history.replace('/rutinas?eliminada=1');
    } catch (error) { setMessage(getUserErrorMessage(error)); }
  };
  return <section className="routine-section" aria-label="Gestionar rutina">
    <h2>Pasos de la rutina</h2>
    {routine.tasks.length ? <ol>{routine.tasks.map(task => <li key={task.id}>{task.title}</li>)}</ol> : <p>Esta rutina todavía no tiene pasos. Añade el primero.</p>}
    <AppButton variant="secondary" onClick={() => history.push('/seguimiento')}>Ver progreso y completar tareas</AppButton>
    {canManage && <>
      {!editing && !confirming && <div className="routine-form__actions"><AppButton disabled={busy} onClick={() => { setMessage(null); setEditing(true); }}>Editar rutina</AppButton><AppButton variant="danger" disabled={busy} onClick={() => setConfirming(true)}>Eliminar rutina</AppButton></div>}
      {editing && online && !offline && <RoutineEditor routine={routine} onCancel={() => setEditing(false)} onSave={async values => {
        setMessage(null);
        try { await changes.update.mutateAsync(values); setEditing(false); setMessage('Los cambios quedaron guardados.'); }
        catch (error) { setMessage(getUserErrorMessage(error)); }
      }} />}
      {confirming && <div role="alertdialog" aria-labelledby="delete-routine-title" aria-describedby="delete-routine-description">
        <h2 id="delete-routine-title">¿Eliminar esta rutina?</h2>
        <p id="delete-routine-description">Se eliminarán “{routine.title}”, sus pasos y su historial de cumplimiento. Esta acción no se puede deshacer.</p>
        <AppButton variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>Conservar rutina</AppButton><AppButton variant="danger" isLoading={changes.remove.isPending} onClick={() => void remove()}>Confirmar eliminación</AppButton>
      </div>}
      {!editing && !confirming && <form className="routine-form" aria-label="Añadir tarea" noValidate onSubmit={handleSubmit(async values => {
        setMessage(null);
        try { await changes.addTask.mutateAsync(values.title); reset(); setMessage('La tarea quedó guardada.'); }
        catch (error) { setMessage(getUserErrorMessage(error)); }
      })}>
        <Controller name="title" control={control} render={({ field }) => <AppInput label="Nueva tarea" value={field.value} error={errors.title?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
        <AppButton type="submit" isLoading={isSubmitting} disabled={busy}>Añadir tarea</AppButton>
      </form>}
    </>}
    {message && <p role="status" aria-live="polite">{message}</p>}
  </section>;
};
