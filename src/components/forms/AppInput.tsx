import type { ComponentProps } from 'react';
import { IonInput } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { logger } from '../../services/telemetry/logger';

export interface AppInputProps extends Omit<ComponentProps<typeof IonInput>, 'label' | 'errorText'> {
  label: string;
  error?: string;
}

const AppInput: React.FC<AppInputProps> = ({ label, error, type = 'text', onClick, ...rest }) => {
  const handleClick: NonNullable<AppInputProps['onClick']> = event => {
    onClick?.(event);
    const input = event.currentTarget;
    if (event.defaultPrevented || input.disabled || input.readonly || Capacitor.getPlatform() !== 'android') return;

    // Android puede conservar el foco cuando Atrás cierra el teclado.
    void input.setFocus().then(() => Keyboard.show()).catch(() => {
      logger.warn('No se pudo abrir el teclado de Android');
    });
  };

  return (
    <IonInput
      label={label}
      type={type}
      inputmode={type === 'email' ? 'email' : 'text'}
      labelPlacement="stacked"
      fill="outline"
      className={`app-input${error ? ' ion-invalid ion-touched' : ''}`}
      errorText={error}
      aria-invalid={Boolean(error)}
      aria-label={label}
      onClick={handleClick}
      {...rest}
    />
  );
};

export default AppInput;
