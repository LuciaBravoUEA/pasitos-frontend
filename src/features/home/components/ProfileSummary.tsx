import { IonChip } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import { isPhotoPickerAvailable } from '../../../services/device/routinePhotoPicker';
import { useLocalPhoto } from '../../../hooks/use-local-photo';
import type { SessionUser } from '../../../types/api/auth';

interface ProfileSummaryProps {
  user: SessionUser;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map(word => word[0]?.toLocaleUpperCase() ?? '')
    .join('');
};

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ user }) => {
  const photo = useLocalPhoto(user.id, 'perfil');
  const profilePhoto = photo.photo;

  return <section className="profile-summary" aria-labelledby="profile-title">
    <div className="profile-summary__avatar" aria-label={profilePhoto ? 'Foto de perfil' : 'Iniciales del perfil'}>
      {profilePhoto ? <img src={profilePhoto} alt={`Foto de perfil de ${user.name}`} onError={photo.onImageError} /> : getInitials(user.name)}
    </div>
    <div className="profile-summary__identity">
      <p className="profile-summary__label">Tu cuenta</p>
      <h2 id="profile-title">{user.name}</h2>
      <p>{user.email}</p>
    </div>
    <div className="profile-summary__roles" aria-label="Roles asignados">
      {user.roles.length > 0 ? (
        user.roles.map(role => <IonChip key={role.id}>{role.name}</IonChip>)
      ) : (
        <p className="profile-summary__empty">Aún no tienes roles asignados.</p>
      )}
    </div>
    {isPhotoPickerAvailable() && <div className="profile-summary__photo-actions" aria-label="Acciones de foto de perfil">
      <AppButton variant="secondary" disabled={photo.busy} onClick={() => void photo.choose('camera')}>Tomar foto</AppButton>
      <AppButton variant="secondary" disabled={photo.busy} onClick={() => void photo.choose('gallery')}>Elegir foto</AppButton>
    </div>}
    {photo.message && <p role="status">{photo.message}</p>}
    {photo.needsSettings && <AppButton variant="ghost" onClick={() => void photo.openSettings()}>Abrir ajustes</AppButton>}
  </section>;
};

export default ProfileSummary;
