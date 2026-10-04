import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from '../routes/AppRoutes';
import { queryClient } from './queryClient';
import { LocalSync } from './local-sync';
import { useSessionStore } from '../store/sessionStore';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode: sigue la preferencia del sistema operativo (prefers-color-scheme) */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import '../theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const navigationSession = useSessionStore(state => state.navigationSession);
  return (
    <QueryClientProvider client={queryClient}>
      <IonApp>
        <LocalSync />
        <IonReactRouter key={navigationSession}>
          <AppRoutes />
        </IonReactRouter>
      </IonApp>
    </QueryClientProvider>
  );
};

export default App;
