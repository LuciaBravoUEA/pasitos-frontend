import { useHistory, useParams } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import AppCard from '../../../components/common/AppCard';
import ResourceState from '../../../components/feedback/ResourceState';
import AppPage from '../../../components/layout/AppPage';
import { isPhotoPickerAvailable } from '../../../services/device/routinePhotoPicker';
import { useLocalPhoto } from '../../../hooks/use-local-photo';
import { useRoutine } from '../hooks/useRoutines';
import { RoutineActions } from '../components/routine-actions';
import './routines.css';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RoutineDetailPage: React.FC = () => {
  const { routineId } = useParams<{ routineId: string }>();
  const history = useHistory();
  const isValidId = UUID_PATTERN.test(routineId);
  const state = useRoutine(routineId, isValidId);
  const photo = useLocalPhoto(routineId, 'rutina');
  const evidencePhoto = photo.photo;

  return (
    <AppPage title="Detalle de rutina">
      <main className="routine-page">
        {!isValidId ? <ResourceState status="error" errorTitle="Dirección de rutina inválida" errorDescription="Regresa al listado y selecciona una rutina disponible."><span /></ResourceState> :
          <ResourceState status={state.status} errorDescription={state.status === 'error' ? state.message : undefined} onRetry={state.status === 'error' ? state.retry : undefined}>
            {state.status === 'success' && <>
              <AppCard title={state.data.title} description={state.data.description ?? 'Sin descripción'} metadata={<dl className="routine-detail"><div><dt>Categoría</dt><dd>{state.data.category}</dd></div><div><dt>Recompensa al completar todos los pasos</dt><dd>{state.data.points} estrellas</dd></div></dl>} />
              <RoutineActions key={state.data.id} routine={state.data} />
              {isPhotoPickerAvailable() && (
                <div className="routine-detail__evidence">
                  {evidencePhoto && <img src={evidencePhoto} alt="Evidencia de la rutina completada" className="routine-detail__evidence-image" onError={photo.onImageError} />}
                  <AppButton variant="secondary" disabled={photo.busy} onClick={() => void photo.choose('gallery')}>{evidencePhoto ? 'Cambiar foto' : 'Adjuntar foto de evidencia'}</AppButton>
                  <AppButton variant="secondary" disabled={photo.busy} onClick={() => void photo.choose('camera')}>Tomar foto</AppButton>
                  {photo.message && <p role="status">{photo.message}</p>}
                  {photo.needsSettings && <AppButton variant="ghost" onClick={() => void photo.openSettings()}>Abrir ajustes</AppButton>}
                </div>
              )}
            </>}
          </ResourceState>}
        <div className="routine-page__navigation">
          <AppButton variant="secondary" onClick={() => history.push('/home')}>Inicio</AppButton>
          <AppButton variant="secondary" onClick={() => history.push('/rutinas')}>Volver a rutinas</AppButton>
        </div>
      </main>
    </AppPage>
  );
};

export default RoutineDetailPage;
