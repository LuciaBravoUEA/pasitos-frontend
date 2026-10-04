import type { ComponentProps, ReactNode } from 'react';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { useSession } from '../features/auth/hooks/useSession';
import { sanitizeReturnTo } from './route-utils';

type PublicRouteProps = Omit<ComponentProps<typeof Route>, 'children' | 'component' | 'render'> & { children?: ReactNode };

const PublicContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSuccess } = useSession();
  const location = useLocation();
  const returnTo = sanitizeReturnTo(new URLSearchParams(location.search).get('returnTo'));

  if (isSuccess) return <Redirect to={returnTo} />;
  return <>{children}</>;
};

const MatchedPublicRoute: React.FC<PublicRouteProps> = ({ children, ...routeProps }) => (
  <Route {...routeProps} render={() => <PublicContent>{children}</PublicContent>} />
);

export default MatchedPublicRoute;
