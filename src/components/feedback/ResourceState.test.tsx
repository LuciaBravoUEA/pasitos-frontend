import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ResourceState from './ResourceState';

describe('ResourceState', () => {
  it('announces loading', () => {
    render(<ResourceState status="loading"><p>Contenido</p></ResourceState>);
    expect(screen.getByRole('status', { name: 'Cargando información' })).toBeInTheDocument();
  });

  it('shows an understandable empty state', () => {
    render(<ResourceState status="empty"><p>Contenido</p></ResourceState>);
    expect(screen.getByText('Todavía no hay elementos')).toBeInTheDocument();
  });

  it('shows an error and delegates retry', () => {
    const onRetry = vi.fn();
    render(<ResourceState status="error" onRetry={onRetry}><p>Contenido</p></ResourceState>);
    const button = document.querySelector('ion-button');
    expect(button).not.toBeNull();
    fireEvent.click(button!);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('delegates success content', () => {
    render(<ResourceState status="success"><p>Contenido real</p></ResourceState>);
    expect(screen.getByText('Contenido real')).toBeInTheDocument();
  });
});
