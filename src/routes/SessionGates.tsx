import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { Redirect, useHistory, useLocation } from 'react-router-dom';
import { useSession } from '../features/auth/hooks/useSession';
import { sanitizeReturnTo } from './route-utils';
import { useSessionStore } from '../store/sessionStore';

export const ProtectedGate: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isPending, isError } = useSession();
  const unauthenticated = useSessionStore(state => state.status === 'unauthenticated');
  const history = useHistory();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const isAuthEntryRoute = location.pathname === '/login' || location.pathname === '/registro';

  useEffect(() => {
    if ((isError || unauthenticated) && !isAuthEntryRoute) {
      history.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [history, isAuthEntryRoute, isError, unauthenticated, returnTo]);

  if (isPending || isError || unauthenticated) return <IonSpinner name="dots" />;
  return <>{children}</>;
};

export const PublicGate: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSuccess } = useSession();
  const unauthenticated = useSessionStore(state => state.status === 'unauthenticated');
  const location = useLocation();
  const returnTo = sanitizeReturnTo(new URLSearchParams(location.search).get('returnTo'));

  if (isSuccess && !unauthenticated) return <Redirect to={returnTo} />;
  return <>{children}</>;
};
