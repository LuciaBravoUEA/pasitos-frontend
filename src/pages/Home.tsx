import { OfflineNotice } from '../components/feedback/offline-notice';
import { useOfflineStatus } from '../store/offline-status';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useIonViewWillEnter } from '@ionic/react';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import ResourceState from '../components/feedback/ResourceState';
import AppPage from '../components/layout/AppPage';
import { useLogoutMutation } from '../features/auth/hooks/useSession';
import ChatbotWidget from '../features/chatbot/components/ChatbotWidget';
import ProfileSummary from '../features/home/components/ProfileSummary';
import TaskReward from '../features/student-tracking/components/task-reward';
import { useTaskReward } from '../features/student-tracking/hooks/use-task-reward';
import { useAssignedStudents, useCompleteTask, useStudentProgress } from '../features/student-tracking/hooks/useStudentTracking';
import { useActivityDate } from '../hooks/use-activity-date';
import { useSessionStore } from '../store/sessionStore';
import './home.css';

const Home: React.FC = () => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const user = useSessionStore(state => state.user);
  const logout = useLogoutMutation();
  const history = useHistory();
  const date = useActivityDate();
  const isStudent = user?.roles.some(role => role.code === 'estudiante') ?? false;
  const progress = useStudentProgress(user?.id ?? '', date, isStudent);
  const assigned = useAssignedStudents(date, Boolean(user) && !isStudent);
  const complete = useCompleteTask(user?.id ?? '', date);
  const celebration = useTaskReward();
  const [message, setMessage] = useState<string | null>(null);
  useIonViewWillEnter(() => {
    if (isStudent) void progress.refetch();
    else if (user) void assigned.refetch();
  });
  const handleLogout = async (): Promise<void> => {
    try { await logout.mutateAsync(); } finally { history.replace('/login'); }
  };
  const mark = async (taskId: string, completed: boolean): Promise<void> => {
    celebration.prepare();
    setMessage(null);
    try {
      const result = await complete.mutateAsync({ taskId, completed });
      if (completed && result.completed) celebration.celebrate(result.title);
      setMessage(completed ? '¡Buen trabajo! Tu avance quedó guardado.' : 'La tarea quedó pendiente. Puedes retomarla cuando estés listo.');
    } catch { setMessage('No se pudo guardar el avance. Comprueba tu conexión y vuelve a intentar.'); }
  };
  return <AppPage title="Pasitos Mágicos"><main className="home-page">
    {user && <>
      <header className="home-hero"><p className="home-hero__eyebrow">Bienvenido</p><h1>Hola, {user.name.split(' ')[0]}</h1><p>Hoy puedes celebrar cada pequeño logro y seguir avanzando con alegría.</p></header>
      <ProfileSummary user={user} />
      <section className="home-section"><AppButton onClick={() => history.push('/seguimiento')}>Ver seguimiento</AppButton></section>
      <AppButton variant="secondary" onClick={() => history.push('/historial')}>Ver historial de actividades</AppButton>
      <AppButton variant="secondary" onClick={() => history.push('/acompanantes')}>{isStudent ? 'Mis acompañantes' : 'Vincular estudiantes'}</AppButton>
      {isStudent ? <ResourceState status={progress.isPending ? 'loading' : progress.isError ? 'error' : progress.data?.totals.tasks ? 'success' : 'empty'} emptyTitle="Comienza tu primera rutina" emptyDescription="Crea una rutina con pequeños pasos para ver tu progreso aquí." errorDescription="No pudimos consultar tu progreso. Comprueba la conexión." onRetry={() => void progress.refetch()} action={!progress.isError && !progress.isPending && !progress.data?.totals.tasks ? <AppButton onClick={() => history.push('/rutinas/nueva')}>Crear rutina</AppButton> : undefined}>
        {progress.data && <><OfflineNotice savedAt={progress.savedAt} cached={progress.cached} />
          <section className="home-summary" aria-label="Progreso diario">
            <AppCard title="Tu avance" description={progress.data.totals.completed + ' de ' + progress.data.totals.tasks + ' tareas completadas'} metadata={<span>{progress.data.totals.progressPercent}% listo</span>} tone="highlight" />
            <AppCard title="Estrellas ganadas hoy" description={String(progress.data.totals.stars)} metadata={<span>Se suman al completar todos los pasos de cada rutina.</span>} />
          </section>
          <TaskReward reward={celebration.reward} onDismiss={celebration.dismiss} />
          <section className="home-section"><h2>Rutinas de hoy</h2>{progress.data.routines.map(routine => <section key={routine.id}><h3>{routine.title}</h3>{routine.tasks.length ? routine.tasks.map(task => <AppCard key={task.id} title={task.title} description={task.completed ? 'Completada' : 'Pendiente'} tone={task.completed ? 'success' : 'default'} actions={<AppButton disabled={complete.isPending || !online || offline} accessibleLabel={(task.completed ? 'Desmarcar ' : 'Completar ') + task.title} onClick={() => void mark(task.id, !task.completed)}>{task.completed ? 'Desmarcar' : 'Completar'}</AppButton>} />) : <p>Añade pasos desde el detalle de esta rutina.</p>}</section>)}</section>
          <section className="home-report"><h2>Reporte de hoy</h2><p>Completaste {progress.data.totals.completed} de {progress.data.totals.tasks} actividades. Tu progreso es {progress.data.totals.progressPercent}%.</p></section>
        </>}
      </ResourceState> : <ResourceState status={assigned.isPending ? 'loading' : assigned.isError ? 'error' : assigned.data?.length ? 'success' : 'empty'} emptyTitle="No hay estudiantes asignados" emptyDescription="Cuando exista una relación educativa, podrás consultar su avance." errorDescription="No pudimos consultar tus estudiantes." onRetry={() => void assigned.refetch()}>
        {assigned.data?.map(student => <AppCard key={student.id} title={student.name} description={student.completedToday + ' de ' + student.tasksToday + ' tareas completadas'} metadata={<span>{student.progressPercent}% de progreso</span>} actions={<AppButton onClick={() => history.push('/seguimiento/' + student.id)}>Ver progreso</AppButton>} />)}
      </ResourceState>}
      {message && <p role="status" aria-live="polite">{message}</p>}
    </>}
    <footer className="home-footer"><AppButton onClick={() => history.push('/rutinas')}>Ver rutinas guardadas</AppButton><AppButton variant="secondary" isLoading={logout.isPending} onClick={() => void handleLogout()}>Cerrar sesión</AppButton></footer>
  </main><ChatbotWidget userName={user?.name.split(' ')[0]} /></AppPage>;
};
export default Home;
