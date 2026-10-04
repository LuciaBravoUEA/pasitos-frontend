import { OfflineNotice } from '../../../components/feedback/offline-notice';
import { useIonViewWillEnter } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppCard from '../../../components/common/AppCard';
import ResourceState from '../../../components/feedback/ResourceState';
import AppPage from '../../../components/layout/AppPage';
import { useActivityDate } from '../../../hooks/use-activity-date';
import { useSessionStore } from '../../../store/sessionStore';
import { useAssignedStudents, useTaskActivityHistory } from '../hooks/useStudentTracking';
import './student-tracking.css';

const supervisoryRoles = new Set(['padre', 'padre_familia', 'tutor', 'docente']);

const ActivityHistoryPage: React.FC = () => {
  const navigation = useHistory();
  const { studentId = '' } = useParams<{ studentId?: string }>();
  const user = useSessionStore(state => state.user);
  const date = useActivityDate();
  const isSupervisor = user?.roles.some(role => supervisoryRoles.has(role.code)) ?? false;
  const assigned = useAssignedStudents(date, isSupervisor && !studentId);
  const selectedStudentId = isSupervisor ? studentId : user?.id ?? '';
  const [page, setPage] = useState(1);
  const [knownTotalPages, setKnownTotalPages] = useState(0);
  const history = useTaskActivityHistory(selectedStudentId, page, Boolean(selectedStudentId));

  useEffect(() => { setPage(1); setKnownTotalPages(0); }, [selectedStudentId]);
  useEffect(() => { if (history.data) setKnownTotalPages(history.data.meta.totalPages); }, [history.data]);
  useIonViewWillEnter(() => {
    if (isSupervisor && !studentId) void assigned.refetch();
    else if (selectedStudentId) void history.refetch();
  });

  if (isSupervisor && !studentId) {
    return <AppPage title="Historial de actividades"><main className="tracking-page">
      <header className="tracking-page__header"><AppButton variant="secondary" onClick={() => navigation.push('/home')}>Inicio</AppButton><h1>Historial de actividades</h1></header>
      <ResourceState status={assigned.isPending ? 'loading' : assigned.isError ? 'error' : assigned.data?.length ? 'success' : 'empty'} emptyTitle="No hay estudiantes asignados" emptyDescription="Cuando un estudiante te autorice, aparecerá aquí." errorDescription="No se pudo cargar la lista de estudiantes." onRetry={() => void assigned.refetch()}>
        {assigned.data && <div className="tracking-grid">{assigned.data.map(student => <AppCard key={student.id} title={student.name} description="Consulta los cambios guardados de sus actividades." actions={<AppButton onClick={() => navigation.push(`/historial/${student.id}`)}>Ver historial</AppButton>} />)}</div>}
      </ResourceState>
    </main></AppPage>;
  }

  const status = history.isPending ? 'loading' : history.isError ? 'error' : history.data?.data.length ? 'success' : 'empty';
  const totalPages = history.data?.meta.totalPages ?? knownTotalPages;

  return <AppPage title="Historial de actividades"><main className="tracking-page">
    <header className="tracking-page__header"><AppButton variant="secondary" onClick={() => navigation.goBack()}>Volver</AppButton><h1>Historial de actividades</h1></header>
    <OfflineNotice savedAt={history.savedAt} cached={history.cached} />
    <ResourceState status={status} emptyTitle="Todavía no hay cambios registrados" emptyDescription="Los cambios nuevos aparecerán aquí. No es posible reconstruir acciones anteriores a la activación del historial." errorDescription="No se pudo cargar esta página. Sin conexión solo puedes consultar las páginas descargadas previamente." onRetry={() => void history.refetch()}>
      {history.data && <div className="tracking-grid" aria-live="polite">
        {history.data.data.map(event => <AppCard
          key={event.id}
          title={event.taskTitle}
          description={`Rutina: ${event.routineTitle} · Registrado: ${new Date(event.recordedAt).toLocaleString()}`}
          metadata={<span>{event.completed ? 'Completada' : 'Desmarcada'} · Fecha de actividad: {event.activityDate}</span>}
        />)}
        <p>{history.data.meta.total} cambios registrados</p>
      </div>}
    </ResourceState>
    {totalPages > 0 && <nav aria-label="Paginación del historial">
      <AppButton variant="secondary" disabled={page <= 1 || history.isFetching} onClick={() => setPage(current => Math.max(1, current - 1))}>Anterior</AppButton>
      <span aria-live="polite">Página {page} de {totalPages}</span>
      <AppButton variant="secondary" disabled={page >= totalPages || history.isFetching} onClick={() => setPage(current => current + 1)}>Siguiente</AppButton>
    </nav>}
  </main></AppPage>;
};

export default ActivityHistoryPage;
