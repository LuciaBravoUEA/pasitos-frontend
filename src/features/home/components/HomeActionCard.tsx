import type { ReactNode } from 'react';
import { IonIcon } from '@ionic/react';

interface HomeActionCardProps {
  icon: string;
  title: string;
  description: string;
  children?: ReactNode;
}

const HomeActionCard: React.FC<HomeActionCardProps> = ({ icon, title, description, children }) => (
  <article className="home-action-card">
    <div className="home-action-card__icon" aria-hidden="true">
      <IonIcon icon={icon} />
    </div>
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  </article>
);

export default HomeActionCard;
