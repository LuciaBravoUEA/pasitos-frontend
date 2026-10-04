import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useOfflineStatus } from '../../store/offline-status';

export const OfflineNotice: React.FC<{ savedAt?: string; cached?: boolean }> = ({ savedAt, cached }) => {
  const online = useNetworkStatus();
  const offline = useOfflineStatus(state => state.offline);
  if (online && !offline && !cached) return null;
  if (savedAt) return <p role="status">Última actualización: {new Date(savedAt).toLocaleString()}. Los datos pueden estar desactualizados.</p>;
  return <aside role="status" className="ion-padding">
    <strong>Sin conexión</strong>
    <p>Puedes consultar tus datos descargados. Para completar actividades, editar rutinas o gestionar acompañantes necesitas conexión.</p>
  </aside>;
};
