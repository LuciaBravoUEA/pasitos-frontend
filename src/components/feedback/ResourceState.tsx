import { IonSpinner } from '@ionic/react';
import type { ReactNode } from 'react';
import AppButton from '../common/AppButton';

export interface ResourceStateProps {
  status: 'loading' | 'empty' | 'error' | 'success';
  children: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  loadingLabel?: string;
  action?: ReactNode;
}

const ResourceState: React.FC<ResourceStateProps> = ({ status, children, emptyTitle = 'Todavía no hay elementos', emptyDescription, errorTitle = 'No pudimos cargar la información', errorDescription, onRetry, loadingLabel = 'Cargando información', action }) => {
  if (status === 'success') return <>{children}</>;

  if (status === 'loading') {
    return <section className="resource-state" role="status" aria-live="polite" aria-label={loadingLabel}><div className="resource-state__content"><IonSpinner aria-hidden="true" /><p>{loadingLabel}</p></div></section>;
  }

  const isError = status === 'error';
  const description = isError ? errorDescription : emptyDescription;

  return (
    <section className="resource-state" role={isError ? 'alert' : 'status'} aria-live="polite">
      <div className="resource-state__content">
        <h2 className="resource-state__title">{isError ? errorTitle : emptyTitle}</h2>
        {description && <p className="resource-state__description">{description}</p>}
        {(action || (isError && onRetry)) && <div className="resource-state__action">{action ?? <AppButton onClick={onRetry}>Intentar nuevamente</AppButton>}</div>}
      </div>
    </section>
  );
};

export default ResourceState;
