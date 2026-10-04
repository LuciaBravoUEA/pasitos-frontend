import { zodResolver } from '@hookform/resolvers/zod';
import { IonSelect, IonSelectOption } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import { ROUTINE_CATEGORIES, type RoutineDetail } from '../../../types/api/routines';
import { createRoutineSchema, type CreateRoutineFormValues } from '../../../validation/routines';

interface Props {
  routine: RoutineDetail;
  onSave: (values: CreateRoutineFormValues) => Promise<void>;
  onCancel: () => void;
}

export const RoutineEditor: React.FC<Props> = ({ routine, onSave, onCancel }) => {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateRoutineFormValues>({
    resolver: zodResolver(createRoutineSchema),
    mode: 'onBlur',
    defaultValues: { title: routine.title, description: routine.description ?? '', category: routine.category, points: routine.points },
  });
  return <form className="routine-form" onSubmit={handleSubmit(onSave)} noValidate aria-label="Editar rutina">
    <h2>Editar rutina</h2>
    <Controller name="title" control={control} render={({ field }) => <AppInput label="Título" value={field.value} error={errors.title?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
    <Controller name="description" control={control} render={({ field }) => <AppInput label="Descripción (opcional)" value={field.value ?? ''} error={errors.description?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
    <Controller name="category" control={control} render={({ field }) => <IonSelect label="Categoría" labelPlacement="stacked" value={field.value} onIonChange={event => field.onChange(event.detail.value)} onIonBlur={field.onBlur}>{ROUTINE_CATEGORIES.map(category => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}</IonSelect>} />
    {errors.category && <p role="alert">{errors.category.message}</p>}
    <Controller name="points" control={control} render={({ field }) => <AppInput label="Puntos" type="number" inputmode="numeric" value={String(field.value)} error={errors.points?.message} onIonInput={event => field.onChange(Number(event.detail.value))} onIonBlur={field.onBlur} />} />
    <p>Los pasos y sus cumplimientos se conservarán.</p>
    <div className="routine-form__actions"><AppButton variant="secondary" disabled={isSubmitting} onClick={onCancel}>Cancelar edición</AppButton><AppButton type="submit" isLoading={isSubmitting}>Guardar cambios</AppButton></div>
  </form>;
};
