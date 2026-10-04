import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Route, useHistory, useLocation } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useSession } from '../features/auth/hooks/useSession';
import { useSessionStore } from '../store/sessionStore';

type ProtectedRouteProps = ComponentProps<typeof Route>;

// Sin sesión válida no se entra — el backend es la autoridad final, esto solo evita el
// parpadeo de UI protegida antes de que el 401 real llegue (tech-stack.md §6).
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, ...routeProps }) => {
  const { isPending, isError } = useSession();
  const unauthenticated = useSessionStore(state => state.status === 'unauthenticated');
  const history = useHistory();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (isError || unauthenticated) {
      history.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [history, isError, unauthenticated, returnTo]);

  if (isPending || isError || unauthenticated) {
    return (
      <Route {...routeProps}>
        <IonSpinner name="dots" />
      </Route>
    );
  }

  return <Route {...routeProps}>{children}</Route>;
};

export default ProtectedRoute;
