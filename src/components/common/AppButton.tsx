import type { ComponentProps } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

export interface AppButtonProps extends ComponentProps<typeof IonButton> {
  isLoading?: boolean;
  loadingLabel?: string;
  accessibleLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

// Bloquea el botón mientras isLoading es true, para prevenir doble envío en operaciones críticas (tech-stack.md §14).
const AppButton: React.FC<AppButtonProps> = ({
  isLoading = false,
  loadingLabel = 'Procesando',
  accessibleLabel,
  variant = 'primary',
  disabled = false,
  children,
  type = 'button',
  ...rest
}) => {
  const appearance = {
    primary: { color: 'primary', fill: 'solid' },
    secondary: { color: 'primary', fill: 'outline' },
    danger: { color: 'danger', fill: 'solid' },
    ghost: { color: 'primary', fill: 'clear' },
  } as const;

  return (
    <IonButton
      className={`app-button app-button--${variant}`}
      type={type}
      color={appearance[variant].color}
      fill={appearance[variant].fill}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : 'false'}
      aria-label={accessibleLabel}
      {...rest}
    >
      {isLoading ? <IonSpinner name="dots" aria-label={loadingLabel} /> : children}
    </IonButton>
  );
};

export default AppButton;
