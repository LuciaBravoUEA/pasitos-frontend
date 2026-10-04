import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AppInput from './AppInput';

describe('AppInput', () => {
  it('declares text input explicitly by default', () => {
    const { container } = render(<AppInput label="Usuario" />);
    expect(container.querySelector('ion-input')).toHaveAttribute('type', 'text');
  });

  it('preserves an explicit password type', () => {
    const { container } = render(<AppInput label="Contraseña" type="password" />);
    expect(container.querySelector('ion-input')).toHaveAttribute('type', 'password');
  });
});
