import type { ComponentProps } from 'react';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { useSession } from '../features/auth/hooks/useSession';
import { sanitizeReturnTo } from './route-utils';
import { useSessionStore } from '../store/sessionStore';

type PublicRouteProps = ComponentProps<typeof Route>;

// Usada en /login: si ya hay sesión válida, no tiene sentido volver a mostrar el login.
const PublicRoute: React.FC<PublicRouteProps> = ({ children, ...routeProps }) => {
  const { isSuccess } = useSession();
  const unauthenticated = useSessionStore(state => state.status === 'unauthenticated');
  const location = useLocation();
  const returnTo = sanitizeReturnTo(new URLSearchParams(location.search).get('returnTo'));

  if (isSuccess && !unauthenticated) {
    return (
      <Route {...routeProps}>
        <Redirect to={returnTo} />
      </Route>
    );
  }

  return <Route {...routeProps}>{children}</Route>;
};

export default PublicRoute;
