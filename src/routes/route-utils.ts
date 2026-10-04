export const DEFAULT_AUTHENTICATED_ROUTE = '/home';
const ALLOWED_PRIVATE_ROUTE = /^\/(home|rutinas(?:\/(?:nueva|[0-9a-f-]+))?)(?:\?.*)?$/i;

export const sanitizeReturnTo = (value: string | null): string => {
  if (!value || !ALLOWED_PRIVATE_ROUTE.test(value) || value.startsWith('//')) return DEFAULT_AUTHENTICATED_ROUTE;
  return value;
};

export const buildLoginRedirect = (pathname: string, search: string): string =>
  `/login?returnTo=${encodeURIComponent(`${pathname}${search}`)}`;
