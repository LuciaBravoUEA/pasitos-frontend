import type { PropsWithChildren, ReactNode } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { OfflineNotice } from '../feedback/offline-notice';

interface AppPageProps {
  title: string;
  toolbarEnd?: ReactNode;
  fullscreen?: boolean;
  showHeader?: boolean;
}

const AppPage: React.FC<PropsWithChildren<AppPageProps>> = ({
  title,
  toolbarEnd,
  fullscreen = true,
  showHeader = true,
  children,
}) => (
  <IonPage>
    {showHeader && (
      <IonHeader>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
          {toolbarEnd}
        </IonToolbar>
      </IonHeader>
    )}
    <IonContent fullscreen={fullscreen}><OfflineNotice />{children}</IonContent>
  </IonPage>
);

export default AppPage;
