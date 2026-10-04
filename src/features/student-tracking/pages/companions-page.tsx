import { useOfflineStatus } from '../../../store/offline-status';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useState } from 'react';
import { useIonViewWillEnter } from '@ionic/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHistory } from 'react-router-dom';
import AppPage from '../../../components/layout/AppPage';
import AppCard from '../../../components/common/AppCard';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import ResourceState from '../../../components/feedback/ResourceState';
import { useSessionStore } from '../../../store/sessionStore';
import { getUserErrorMessage } from '../../../services/api/errorMapper';
import { companionSearchSchema, type CompanionSearchValues } from '../../../validation/companions';
import type { Companion } from '../../../types/api/companions';
import { useCompanions } from '../hooks/use-companions';
import './student-tracking.css';

const roleLabel = (role: Companion['role']) => role === 'docente' ? 'Docente' : 'Padre/madre de familia';

const CompanionsPage: React.FC = () => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const user = useSessionStore(state => state.user);
  const isStudent = user?.roles.some(role => role.code === 'estudiante') ?? false;
  const history = useHistory();
  const { account, search, authorize, revoke } = useCompanions(user?.id ?? '');
  const [candidate, setCandidate] = useState<Companion | null>(null);
  const [removing, setRemoving] = useState<Companion | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = !online || offline || search.isPending || authorize.isPending || revoke.isPending;
  const { control, handleSubmit } = useForm<CompanionSearchValues>({ resolver: zodResolver(companionSearchSchema), defaultValues: { username: '' } });
  useIonViewWillEnter(() => { setCandidate(null); setRemoving(null); setMessage(null); setError(null); void account.refetch(); });

  const find = async ({ username }: CompanionSearchValues) => {
    setCandidate(null); setMessage(null); setError(null);
    try { setCandidate(await search.mutateAsync(username)); }
    catch (cause) { setError(getUserErrorMessage(cause)); }
  };
  const confirm = async () => {
    if (!candidate || busy) return;
    setError(null); setMessage(null);
    try {
      const adult = await authorize.mutateAsync(candidate.id);
      setCandidate(null);
      setMessage(adult.name + ' ya puede consultar tus actividades y tu progreso.');
    } catch (cause) { setError(getUserErrorMessage(cause)); }
  };
  const remove = async () => {
    if (!removing || busy) return;
    setError(null); setMessage(null);
    try {
      await revoke.mutateAsync(removing.id);
      setRemoving(null);
      setMessage('El acceso fue retirado. Tus actividades y tu progreso se conservan.');
    } catch (cause) { setError(getUserErrorMessage(cause)); }
  };
  const alreadyLinked = candidate && account.data?.companions.some(adult => adult.id === candidate.id);

  return <AppPage title={isStudent ? 'Mis acompañantes' : 'Vincular estudiantes'}><main className="tracking-page">
    <header className="tracking-page__header"><AppButton variant="secondary" onClick={() => history.push('/home')}>Inicio</AppButton><h1>{isStudent ? 'Mis acompañantes' : 'Vincular estudiantes'}</h1></header>
    <ResourceState status={account.isPending ? 'loading' : account.isError ? 'error' : 'success'} errorDescription="No pudimos consultar tus vínculos. Comprueba la conexión." onRetry={() => void account.refetch()}>
      {account.data && (isStudent ? <div className="tracking-grid">
        <AppCard title="Autoriza a un adulto de confianza" description="Con ayuda de tu familia, escribe el usuario de tu padre, madre o docente. Revisa su nombre antes de permitirle consultar tus actividades.">
          <form onSubmit={handleSubmit(find)} noValidate>
            <Controller name="username" control={control} render={({ field, fieldState }) => <AppInput label="Usuario del adulto" value={field.value} disabled={busy} error={fieldState.error?.message} onIonInput={event => { field.onChange(event.detail.value ?? ''); setCandidate(null); }} onIonBlur={field.onBlur} />} />
            <AppButton type="submit" isLoading={search.isPending} disabled={busy}>Buscar acompañante</AppButton>
          </form>
        </AppCard>
        {candidate && <AppCard title="Comprueba a quién autorizas" description={candidate.name} metadata={<span>@{candidate.username} · {roleLabel(candidate.role)}</span>}>
          <p>Podrá ver tus rutinas, tareas y progreso. No podrá completar tus tareas. Puedes retirar el acceso cuando quieras.</p>
          {alreadyLinked ? <p>Esta persona ya está vinculada.</p> : <AppButton isLoading={authorize.isPending} disabled={busy} onClick={() => void confirm()}>Autorizar acompañante</AppButton>}
          <AppButton variant="secondary" disabled={busy} onClick={() => setCandidate(null)}>Cancelar</AppButton>
        </AppCard>}
        <h2>Personas autorizadas</h2>
        {account.data.companions.length === 0 && <p>Aún no tienes acompañantes. Primero deben crear su cuenta de padre/madre o docente.</p>}
        {account.data.companions.map(adult => <AppCard key={adult.id} title={adult.name} description={'@' + adult.username + ' · ' + roleLabel(adult.role)} actions={<AppButton variant="secondary" disabled={busy} onClick={() => { setRemoving(adult); setError(null); setMessage(null); }}>Retirar acceso a {adult.name}</AppButton>} />)}
        {removing && <section role="alertdialog" aria-labelledby="remove-companion-title">
          <h2 id="remove-companion-title">Retirar acceso a {removing.name}</h2>
          <p>Ya no podrá consultar tus actividades. No se eliminará ninguna cuenta ni tarea.</p>
          <AppButton variant="secondary" disabled={busy} onClick={() => setRemoving(null)}>Conservar acceso</AppButton>
          <AppButton variant="danger" disabled={busy} isLoading={revoke.isPending} onClick={() => void remove()}>Confirmar retirada</AppButton>
        </section>}
      </div> : <AppCard title="Comparte tu usuario con tu estudiante" description={'Tu usuario es: ' + account.data.username}>
        <ol><li>El estudiante inicia sesión en su propia cuenta, con ayuda de su familia.</li><li>Abre «Mis acompañantes» desde Inicio y busca tu usuario.</li><li>Comprueba tu nombre y perfil y pulsa «Autorizar acompañante».</li><li>Vuelve a tu cuenta y abre «Ver seguimiento» para consultar sus actividades.</li></ol>
        <p>No necesitas su contraseña. Solo verás a los estudiantes que te autoricen.</p>
        <AppButton onClick={() => history.push('/seguimiento')}>Ver mis estudiantes</AppButton>
      </AppCard>)}
    </ResourceState>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </main></AppPage>;
};

export default CompanionsPage;
