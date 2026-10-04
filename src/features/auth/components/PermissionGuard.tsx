import type { PropsWithChildren } from 'react';
import { useSessionStore } from '../../../store/sessionStore';

interface PermissionGuardProps {
  permission: string | string[];
}

// Solo oculta/muestra UI — la autorización real siempre la decide el backend (mission.md).
const PermissionGuard: React.FC<PropsWithChildren<PermissionGuardProps>> = ({ permission, children }) => {
  const permissions = useSessionStore(state => state.user?.permissions ?? []);
  const required = Array.isArray(permission) ? permission : [permission];
  const hasPermission = required.some(code => permissions.some(userPermission => userPermission.code === code));

  return hasPermission ? <>{children}</> : null;
};

export default PermissionGuard;
