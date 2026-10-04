import type { ReactNode } from 'react';

export interface AppCardProps {
  title: string;
  description?: string;
  leading?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  tone?: 'default' | 'highlight' | 'success' | 'warning';
  className?: string;
  titleId?: string;
}

const AppCard: React.FC<AppCardProps> = ({ title, description, leading, metadata, actions, children, tone = 'default', className = '', titleId }) => (
  <article className={`app-card app-card--${tone} ${className}`.trim()} aria-labelledby={titleId}>
    <div className="app-card__layout">
      {leading}
      <div className="app-card__content">
        <h3 className="app-card__title" id={titleId}>{title}</h3>
        {description && <p className="app-card__description">{description}</p>}
        {metadata && <div className="app-card__metadata">{metadata}</div>}
        {children && <div className="app-card__body">{children}</div>}
        {actions && <div className="app-card__actions">{actions}</div>}
      </div>
    </div>
  </article>
);

export default AppCard;
