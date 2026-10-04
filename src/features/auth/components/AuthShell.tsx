import type { PropsWithChildren } from 'react';
import { IonIcon } from '@ionic/react';
import { sparklesOutline } from 'ionicons/icons';

interface AuthShellProps {
  title: string;
  description: string;
}

const AuthShell: React.FC<PropsWithChildren<AuthShellProps>> = ({ title, description, children }) => (
  <main className="auth-shell">
    <section className="auth-shell__intro" aria-labelledby="auth-brand-title">
      <div className="auth-shell__brand-mark" aria-hidden="true">
        <IonIcon icon={sparklesOutline} />
      </div>
      <p className="auth-shell__eyebrow">Acompañamiento positivo</p>
      <h1 id="auth-brand-title" className="auth-shell__brand-name">
        Pasitos Mágicos
      </h1>
      <p className="auth-shell__brand-copy">
        Acompañamos cada paso para que la rutina sea más fácil, alegre y motivadora.
      </p>
    </section>

    <section className="auth-shell__card" aria-labelledby="auth-form-title">
      <header className="auth-shell__card-header">
        <h2 id="auth-form-title">{title}</h2>
        <p>{description}</p>
      </header>
      {children}
    </section>
  </main>
);

export default AuthShell;
