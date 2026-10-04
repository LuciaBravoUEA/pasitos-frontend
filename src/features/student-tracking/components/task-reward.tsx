import AppButton from '../../../components/common/AppButton';
import { useRewardPreferences } from '../../../store/reward-preferences';
import './task-reward.css';

interface TaskRewardProps {
  reward: { title: string; sequence: number } | null;
  onDismiss: () => void;
}

const TaskReward: React.FC<TaskRewardProps> = ({ reward, onDismiss }) => {
  const { soundEnabled, loaded, toggleSound, error } = useRewardPreferences();
  return <section className="task-reward" aria-label="Recompensas de actividades">
    <AppButton variant="ghost" disabled={!loaded} aria-pressed={soundEnabled} onClick={toggleSound}>
      {soundEnabled ? 'Silenciar celebraciones' : 'Activar sonido de celebraciones'}
    </AppButton>
    {error && <p role="status">{error}</p>}
    <div className={reward ? 'task-reward__notice' : undefined}>
      <div role="status" aria-live="polite" aria-atomic="true">
        {reward && <div className="task-reward__celebration" key={reward.sequence}>
        <span className="task-reward__star" aria-hidden="true">★</span>
        <div><strong>¡Un paso más, lo lograste!</strong><p>Completaste «{reward.title}». Cada pequeño esfuerzo cuenta.</p></div>
        </div>}
      </div>
      {reward && <AppButton variant="ghost" onClick={onDismiss}>Cerrar celebración</AppButton>}
    </div>
  </section>;
};

export default TaskReward;
