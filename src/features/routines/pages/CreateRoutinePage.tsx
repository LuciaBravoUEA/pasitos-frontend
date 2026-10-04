import { zodResolver } from '@hookform/resolvers/zod';
import { IonCheckbox, IonTextarea, IonSelect, IonSelectOption, IonText, useIonViewWillEnter } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppCard from '../../../components/common/AppCard';
import AppInput from '../../../components/forms/AppInput';
import AppPage from '../../../components/layout/AppPage';
import { getLocalValue as getPreference, removeLocalValue as removePreference, setLocalValue as setPreference } from '../../../services/local/local-database';
import { ValidationError, getUserErrorMessage } from '../../../services/api/errorMapper';
import { useNotificationReminderPermission } from '../../../hooks/useNotificationReminderPermission';
import { isNotificationsCapabilityAvailable } from '../../../services/device/notificationPermission';
import { deliverReminderIntents, saveReminderIntent } from '../../../services/local/reminder-intents';
import { ROUTINE_CATEGORIES, type CreateRoutineRequest, type Routine } from '../../../types/api/routines';
import { routineWithTasksSchema, type RoutineWithTasksValues } from '../../../validation/routines';
import { useCreateRoutine } from '../hooks/useRoutines';
import './routines.css';

const DRAFT_KEY = 'routine_creation_draft';
const FIELD_NAMES = ['title', 'description', 'category', 'points', 'tasksText'] as const;
type FieldName = (typeof FIELD_NAMES)[number];
const isFieldName = (value: string | undefined): value is FieldName => Boolean(value && FIELD_NAMES.includes(value as FieldName));

const CreateRoutinePage: React.FC = () => {
  const history = useHistory();
  const mutation = useCreateRoutine();
  const [wantsReminder, setWantsReminder] = useState(false);
  const [saved, setSaved] = useState<{ routine?: Routine; message: string } | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { ensurePermission, degradationMessage, openSettings } = useNotificationReminderPermission();
  const { control, handleSubmit, reset, setError, watch, formState: { errors, isSubmitting } } = useForm<RoutineWithTasksValues>({
    resolver: zodResolver(routineWithTasksSchema),
    mode: 'onBlur',
    defaultValues: { title: '', description: '', category: 'ESCUELA', points: 10 },
  });

  useIonViewWillEnter(() => {
    if (!saved) return;
    setSaved(null);
    setWantsReminder(false);
    setSaveError(null);
    mutation.reset();
    reset({ title: '', description: '', category: 'ESCUELA', points: 10 });
  });

  useEffect(() => {
    void getPreference(DRAFT_KEY).then(value => {
      if (!value) return;
      try { reset(routineWithTasksSchema.parse(JSON.parse(value))); } catch { void removePreference(DRAFT_KEY); }
    }).catch(() => setSaveError('No se pudo recuperar el borrador. Puedes completar el formulario.'));
  }, [reset]);

  useEffect(() => {
    const subscription = watch(value => {
      const draft = { title: value.title ?? '', description: value.description ?? '', category: value.category ?? 'ESCUELA', points: value.points ?? 10, tasksText: value.tasksText ?? '' };
      void setPreference(DRAFT_KEY, JSON.stringify(draft)).catch(() => setSaveError('No se pudo guardar el borrador en este dispositivo.'));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const toggleReminder = async (checked: boolean): Promise<void> => {
    if (permissionBusy) return;
    setWantsReminder(checked);
    if (!checked) return;
    setPermissionBusy(true);
    try {
      await ensurePermission();
    } finally {
      setPermissionBusy(false);
    }
  };

  const onSubmit = async (values: RoutineWithTasksValues): Promise<void> => {
    if (saved || permissionBusy) return;
    setSaveError(null);
    try {
      const { tasksText, ...fields } = values;
      const request: CreateRoutineRequest = { ...fields, ...(tasksText?.trim() ? { tasks: tasksText.trim().split('\n').map(line => line.trim()) } : {}) };
      const tomorrowMorning = new Date();
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      tomorrowMorning.setHours(9, 0, 0, 0);
      const reminderAt = wantsReminder ? tomorrowMorning.toISOString() : undefined;
      const created = await mutation.mutateAsync({ request, reminderAt });
      if ('queued' in created) {
        setSaved({ message: wantsReminder ? 'Rutina guardada en este dispositivo. Se sincronizará al recuperar conexión; conservamos también tu recordatorio.' : 'Rutina guardada en este dispositivo. Se sincronizará al recuperar conexión.' });
        await removePreference(DRAFT_KEY).catch(() => undefined);
        return;
      }
      setSaved({ routine: created, message: 'La rutina se guardó correctamente.' });
      await removePreference(DRAFT_KEY).catch(() => undefined);
      if (reminderAt) {
        try {
          await saveReminderIntent(created, reminderAt);
          const pending = await deliverReminderIntents();
          setSaved({ routine: created, message: pending ? 'La rutina está guardada. El recordatorio sigue pendiente; puedes activarlo desde Mis rutinas.' : 'La rutina está guardada. Te avisaremos mañana, aproximadamente a las 9:00.' });
        } catch {
          setSaved({ routine: created, message: 'La rutina está guardada, pero no se pudo guardar el aviso. Puedes reintentar solo el recordatorio.' });
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        // Bug corregido: un detalle de campo que el formulario no mapea (fuera de FIELD_NAMES,
        // o sin detalles en absoluto) se perdía en silencio — ver CreateRoutinePage.validation.test.tsx.
        const mappedField = error.details?.some(detail => isFieldName(detail.field));
        error.details?.forEach(detail => { if (isFieldName(detail.field)) setError(detail.field, { type: 'server', message: detail.message }); });
        if (!mappedField) setSaveError(getUserErrorMessage(error));
      } else {
        setSaveError(getUserErrorMessage(error));
      }
    }
  };

  const retryReminder = async (): Promise<void> => {
    if (!saved?.routine || reminderBusy) return;
    setReminderBusy(true);
    try {
      if (!await ensurePermission()) return;
      const at = new Date();
      at.setDate(at.getDate() + 1);
      at.setHours(9, 0, 0, 0);
      await saveReminderIntent(saved.routine, at.toISOString());
      const pending = await deliverReminderIntents();
      setSaved({ ...saved, message: pending ? 'La rutina sigue guardada. Revisa los recordatorios pendientes en Mis rutinas.' : 'Recordatorio activado para mañana, aproximadamente a las 9:00.' });
    } catch {
      setSaved({ ...saved, message: 'La rutina sigue guardada. No se pudo activar el recordatorio; puedes continuar sin él.' });
    } finally { setReminderBusy(false); }
  };

  const cancel = async (): Promise<void> => {
    await removePreference(DRAFT_KEY).catch(() => undefined);
    history.push('/rutinas');
  };

  return (
    <AppPage title="Crear rutina">
      <main className="routine-page routine-page--form">
        <nav className="routine-page__navigation" aria-label="Navegación de rutina">
          <AppButton variant="secondary" onClick={() => history.push('/home')}>Inicio</AppButton>
          <AppButton variant="secondary" onClick={() => history.push('/rutinas')}>Mis rutinas</AppButton>
        </nav>
        {saved ? <AppCard title="Rutina guardada" description={saved.message}>
          {degradationMessage && <p role="status">{degradationMessage}</p>}
          {wantsReminder && <AppButton variant="ghost" onClick={() => void openSettings()}>Abrir ajustes de notificaciones</AppButton>}
          {wantsReminder && saved.routine && <AppButton variant="secondary" disabled={reminderBusy || isSubmitting} onClick={() => void retryReminder()}>Activar recordatorio mañana</AppButton>}
          <AppButton onClick={() => history.replace(saved.routine ? `/rutinas/${saved.routine.id}` : '/rutinas')}>Continuar</AppButton>
        </AppCard> : <AppCard title="Nueva rutina" description="Define una actividad pequeña, clara y alcanzable.">
          <form className="routine-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Controller name="title" control={control} render={({ field }) => <AppInput label="Título" value={field.value} error={errors.title?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
            <Controller name="description" control={control} render={({ field }) => <AppInput label="Descripción (opcional)" value={field.value ?? ''} error={errors.description?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
            <Controller name="category" control={control} render={({ field }) => <IonSelect label="Categoría" labelPlacement="stacked" fill="outline" value={field.value} onIonChange={event => field.onChange(event.detail.value)} onIonBlur={field.onBlur} aria-label="Categoría" className={errors.category ? 'ion-invalid ion-touched' : ''}>{ROUTINE_CATEGORIES.map(category => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}</IonSelect>} />
            {errors.category && <IonText color="danger"><p>{errors.category.message}</p></IonText>}
            <Controller name="points" control={control} render={({ field }) => <AppInput label="Puntos" type="number" inputmode="numeric" value={String(field.value)} error={errors.points?.message} onIonInput={event => field.onChange(Number(event.detail.value))} onIonBlur={field.onBlur} />} />
            <Controller name="tasksText" control={control} render={({ field }) => <IonTextarea label="Pasos de la rutina (uno por línea)" labelPlacement="stacked" fill="outline" autoGrow value={field.value ?? ''} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} aria-label="Pasos de la rutina" />} />
            <p>Si lo dejas vacío, se creará una tarea con el nombre de la rutina.</p>
            {errors.tasksText && <p role="alert">{errors.tasksText.message}</p>}
            {isNotificationsCapabilityAvailable() && (
              <div className="routine-form__reminder">
                <IonCheckbox checked={wantsReminder} disabled={permissionBusy || isSubmitting} onIonChange={event => void toggleReminder(event.detail.checked)} aria-label="Recordarme esta rutina mañana">
                  Recordarme esta rutina mañana
                </IonCheckbox>
                {degradationMessage && (
                  <IonText color="medium">
                    <p>{degradationMessage} <AppButton variant="ghost" onClick={() => void openSettings()}>Abrir ajustes</AppButton></p>
                  </IonText>
                )}
              </div>
            )}
            {mutation.isError && !(mutation.error instanceof ValidationError) && <IonText role="alert" color="danger"><p>{getUserErrorMessage(mutation.error)}</p></IonText>}
            {saveError && <p role="status">{saveError}</p>}
            <div className="routine-form__actions"><AppButton variant="secondary" onClick={() => void cancel()}>Cancelar</AppButton><AppButton type="submit" disabled={permissionBusy} isLoading={isSubmitting || mutation.isPending}>Crear rutina</AppButton></div>
          </form>
        </AppCard>}
      </main>
    </AppPage>
  );
};

export default CreateRoutinePage;
