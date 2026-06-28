import type React from 'react';

export const panel: React.CSSProperties = {
  background: 'var(--color-bg-secondary)',
  borderRight: '1px solid var(--color-border)',
  overflow: 'auto',
};

export const btnPrimary: React.CSSProperties = {
  padding: 'var(--space-sm) var(--space-lg)',
  background: 'var(--color-primary)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-body)',
  fontWeight: 'var(--font-weight-medium)',
};

export const btnDanger: React.CSSProperties = {
  padding: 'var(--space-sm) var(--space-lg)',
  background: 'var(--color-danger)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-body)',
};

export const btnGhost: React.CSSProperties = {
  padding: 'var(--space-xs) var(--space-sm)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-small)',
};

export const btnIcon: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  padding: 0,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-body)',
};

export const inputText: React.CSSProperties = {
  flex: 1,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-xs) var(--space-sm)',
  fontSize: 'var(--font-size-body)',
  background: 'var(--color-bg-primary)',
  color: 'var(--color-text-primary)',
};
