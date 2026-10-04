import { OfflineNotice } from '../../../components/feedback/offline-notice';
import { useOfflineStatus } from '../../../store/offline-status';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useIonViewWillEnter } from '@ionic/react';
import { useActivityDate } from '../../../hooks/use-activity-date';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppCard from '../../../components/common/AppCard';
import ResourceState from '../../../components/feedback/ResourceState';
import AppPage from '../../../components/layout/AppPage';
import { useSessionStore } from '../../../store/sessionStore';
import { useAssignedStudents, useCompleteTask, useStudentProgress } from '../hooks/useStudentTracking';
import { useTaskReward } from '../hooks/use-task-reward';
import TaskReward from '../components/task-reward';
import './student-tracking.css';

const supervisoryRoles = new Set(['padre', 'padre_familia', 'tutor', 'docente']);

const StudentTrackingPage: React.FC = () => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const history = useHistory();
  const { studentId = '' } = useParams<{ studentId?: string }>();
  const user = useSessionStore(state => state.user);
  const date = useActivityDate();
  const role = user?.roles[0]?.code ?? '';
  const isSupervisor = supervisoryRoles.has(role);
  const selectedStudentId = isSupervisor ? studentId : user?.id ?? '';
  const assigned = useAssignedStudents(date, isSupervisor && !studentId);
  const progress = useStudentProgress(selectedStudentId, date, Boolean(selectedStudentId));
  const completeMutation = useCompleteTask(selectedStudentId, date);
  const celebration = useTaskReward();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useIonViewWillEnter(() => {
    if (isSupervisor && !studentId) void assigned.refetch();
    else if (selectedStudentId) void progress.refetch();
  });

  if (isSupervisor && !studentId) {
    return <AppPage title="Mis estudiantes"><main className="tracking-page"><header className="tracking-page__header"><p>Seguimiento diario</p><h1>Mis estudiantes</h1><AppButton variant="secondary" onClick={() => history.push('/home')}>Inicio</AppButton></header><ResourceState status={assigned.isPending ? 'loading' : assigned.isError ? 'error' : assigned.data?.length ? 'success' : 'empty'} emptyTitle="No hay estudiantes asignados" emptyDescription="Cuando exista una relación educativa, aparecerá aquí." errorDescription="No se pudo cargar la lista de estudiantes." onRetry={() => void assigned.refetch()}>{assigned.data && <div className="tracking-grid">{assigned.data.map(student => <AppCard key={student.id} title={student.name} description={`${student.completedToday} de ${student.tasksToday} tareas completadas`} metadata={<span>{student.progressPercent}% de progreso</span>} actions={<AppButton onClick={() => history.push(`/seguimiento/${student.id}`)}>Ver progreso</AppButton>} />)}</div>}</ResourceState></main></AppPage>;
  }

  const state = progress.isPending ? 'loading' : progress.isError ? 'error' : progress.data ? 'success' : 'empty';
  return <AppPage title="Progreso del estudiante"><main className="tracking-page"><header className="tracking-page__header"><AppButton variant="secondary" onClick={() => history.goBack()}>Volver</AppButton><p>{progress.data?.date ?? date}</p><h1>{progress.data?.student.name ?? 'Progreso'}</h1></header><ResourceState status={state} emptyTitle="No hay progreso disponible" emptyDescription="Este estudiante todavía no tiene tareas registradas." errorDescription="No se pudo cargar el progreso." onRetry={() => void progress.refetch()}>{progress.data && <><OfflineNotice savedAt={progress.savedAt} cached={progress.cached} /><section className="tracking-summary"><AppCard title="Progreso" description={`${progress.data.totals.progressPercent}%`} metadata={<span>{progress.data.totals.completed} de {progress.data.totals.tasks} completadas</span>} tone="highlight" /></section>{!isSupervisor && <TaskReward reward={celebration.reward} onDismiss={celebration.dismiss} />}{progress.data.routines.map(routine => <section className="tracking-routine" key={routine.id}><h2>{routine.title}</h2>{routine.tasks.map(task => <AppCard key={task.id} title={task.title} description={task.completedAt ? `Completada a las ${new Date(task.completedAt).toLocaleTimeString()}` : 'Pendiente'} metadata={<span>{task.completed ? 'Completada' : 'Pendiente'}</span>} actions={!isSupervisor ? <AppButton variant={task.completed ? 'secondary' : 'primary'} disabled={!online || offline} isLoading={completeMutation.isPending} onClick={() => { celebration.prepare(); setErrorMessage(null); completeMutation.mutate({ taskId: task.id, completed: !task.completed }, { onSuccess: result => { if (!task.completed && result.completed) celebration.celebrate(result.title); }, onError: () => setErrorMessage('No se pudo guardar el cumplimiento.') }); }}>{task.completed ? 'Desmarcar' : 'Completar'}</AppButton> : undefined} />)}</section>)}{errorMessage && <p role="alert">{errorMessage}</p>}</>}</ResourceState></main></AppPage>;
};

export default StudentTrackingPage;
