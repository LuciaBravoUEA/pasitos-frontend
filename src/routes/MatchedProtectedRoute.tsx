import type { ComponentProps, ReactNode } from 'react';
import { useEffect } from 'react';
import { IonSpinner } from '@ionic/react';
import { Route, useHistory, useLocation } from 'react-router-dom';
import { useSession } from '../features/auth/hooks/useSession';

type ProtectedRouteProps = Omit<ComponentProps<typeof Route>, 'children' | 'component' | 'render'> & { children?: ReactNode };

const ProtectedContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isPending, isError } = useSession();
  const history = useHistory();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (isError) history.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }, [history, isError, returnTo]);

  if (isPending || isError) return <IonSpinner name="dots" />;
  return <>{children}</>;
};

const MatchedProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, ...routeProps }) => (
  <Route {...routeProps} render={() => <ProtectedContent>{children}</ProtectedContent>} />
);

export default MatchedProtectedRoute;
