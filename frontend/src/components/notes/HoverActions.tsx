interface HoverActionsProps {
  visible: boolean;
  onRename: () => void;
  onDelete: () => void;
  disabled: boolean;
}

const btnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
  fontSize: 'var(--font-size-small)',
  padding: '2px 4px',
  borderRadius: 'var(--radius-sm)',
  lineHeight: 1,
};

export default function HoverActions({ visible, onRename, onDelete, disabled }: HoverActionsProps) {
  return (
    <span
      style={{
        display: 'flex',
        gap: 'var(--space-xs)',
        flexShrink: 0,
        marginLeft: 'var(--space-xs)',
        opacity: disabled ? 0 : visible ? 1 : 0,
        transition: 'opacity 0.1s ease',
        pointerEvents: disabled ? 'none' : visible ? 'auto' : 'none',
      }}
    >
      <button
        title="重命名"
        onClick={e => { e.stopPropagation(); onRename(); }}
        onMouseDown={e => e.stopPropagation()}
        style={btnStyle}
      >✏️</button>
      <button
        title="删除"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        onMouseDown={e => e.stopPropagation()}
        style={btnStyle}
      >🗑</button>
    </span>
  );
}
