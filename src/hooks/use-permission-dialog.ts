import { useIonAlert } from '@ionic/react';
import { useCallback } from 'react';

export const usePermissionDialog = () => {
  const [presentAlert] = useIonAlert();
  return useCallback((message: string): Promise<boolean> => new Promise(resolve => {
    void presentAlert({
      header: 'Permiso opcional',
      message,
      onDidDismiss: event => resolve(event.detail.role === 'confirm'),
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        { text: 'Continuar', role: 'confirm' },
      ],
    }).catch(() => resolve(false));
  }), [presentAlert]);
};
