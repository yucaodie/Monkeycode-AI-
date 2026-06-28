import { useState, type ReactNode } from 'react';

interface SectionGroupProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function SectionGroup({ title, defaultExpanded = true, children }: SectionGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: 'var(--space-xs)' }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          padding: 'var(--space-xs) var(--space-lg)',
          cursor: 'pointer',
          userSelect: 'none',
          fontSize: 'var(--font-size-small)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-sidebar-section-title)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span style={{ fontSize: '10px', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          &#9654;
        </span>
        <span>{title}</span>
      </div>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) var(--space-lg)',
        color: active ? 'var(--color-sidebar-text-active)' : 'var(--color-sidebar-text)',
        background: active ? 'var(--color-sidebar-active)' : 'transparent',
        borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent',
        cursor: 'pointer',
        fontSize: 'var(--font-size-body)',
        transition: 'all 0.15s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-hover)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
