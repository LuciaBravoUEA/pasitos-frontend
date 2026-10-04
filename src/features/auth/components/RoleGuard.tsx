import type { PropsWithChildren } from 'react';
import { useSessionStore } from '../../../store/sessionStore';

interface RoleGuardProps {
  role: string | string[];
}

const RoleGuard: React.FC<PropsWithChildren<RoleGuardProps>> = ({ role, children }) => {
  const roles = useSessionStore(state => state.user?.roles ?? []);
  const required = Array.isArray(role) ? role : [role];
  const hasRole = required.some(code => roles.some(userRole => userRole.code === code));

  return hasRole ? <>{children}</> : null;
};

export default RoleGuard;
