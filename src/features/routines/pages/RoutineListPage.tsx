import { useOfflineStatus } from '../../../store/offline-status';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useHistory, useLocation } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppCard from '../../../components/common/AppCard';
import ResourceState from '../../../components/feedback/ResourceState';
import AppPage from '../../../components/layout/AppPage';
import { useRoutines } from '../hooks/useRoutines';
import { PendingOperations } from '../components/pending-operations';
import './routines.css';

const getPage = (search: string): number => {
  const value = Number.parseInt(new URLSearchParams(search).get('page') ?? '1', 10);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

const RoutineListPage: React.FC = () => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  const history = useHistory();
  const location = useLocation();
  const page = getPage(location.search);
  const { state, meta, syncStatus } = useRoutines(page);

  return (
    <AppPage title="Mis rutinas">
      <main className="routine-page">
        <header className="routine-page__header">
          <div><p className="routine-page__eyebrow">Organiza pequeños pasos</p><h1>Rutinas</h1></div>
          <div className="routine-page__navigation">
            <AppButton variant="secondary" onClick={() => history.push('/home')}>Inicio</AppButton>
            <AppButton onClick={() => history.push('/rutinas/nueva')}>Crear rutina</AppButton>
          </div>
        </header>
        <PendingOperations />
        {new URLSearchParams(location.search).get('eliminada') === '1' && <p role="status">La rutina se eliminó correctamente.</p>}

        {syncStatus.lastSyncedAt && <p role="status" className="routine-page__sync-status">
          {(!online || offline || syncStatus.isStale) ? 'Puedes estar viendo datos desactualizados.' : 'Datos sincronizados.'}{' '}
          Última sincronización: {new Date(syncStatus.lastSyncedAt).toLocaleString()}.
        </p>}

        <ResourceState
          status={state.status}
          emptyTitle="Todavía no tienes rutinas"
          emptyDescription="Crea una actividad pequeña para comenzar."
          errorDescription={state.status === 'error' ? state.message : undefined}
          onRetry={state.status === 'error' ? state.retry : undefined}
          action={state.status === 'empty' ? <AppButton onClick={() => history.push('/rutinas/nueva')}>Crear la primera rutina</AppButton> : undefined}
        >
          {state.status === 'success' && <div className="routine-grid">
            {state.data.map(routine => <AppCard key={routine.id} title={routine.title} description={routine.description ?? 'Sin descripción'} metadata={<span>{routine.category} · {routine.points} estrellas</span>} actions={<AppButton variant="secondary" onClick={() => history.push(`/rutinas/${routine.id}`)}>Ver detalle</AppButton>} />)}
          </div>}
        </ResourceState>

        {meta && meta.totalPages > 1 && <nav className="routine-pagination" aria-label="Paginación de rutinas">
          <AppButton variant="secondary" disabled={page <= 1} onClick={() => history.push(`/rutinas?page=${page - 1}`)}>Anterior</AppButton>
          <span>Página {page} de {meta.totalPages}</span>
          <AppButton variant="secondary" disabled={page >= meta.totalPages} onClick={() => history.push(`/rutinas?page=${page + 1}`)}>Siguiente</AppButton>
        </nav>}
      </main>
    </AppPage>
  );
};

export default RoutineListPage;
