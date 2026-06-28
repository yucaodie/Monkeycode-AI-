export default function DeleteConfirmDialog({
  name,
  loading,
  onConfirm,
  onCancel,
}: {
  name: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
      }}
      onClick={onCancel}
      onKeyDown={e => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-xl)',
          minWidth: 280,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{
          margin: 0,
          marginBottom: 'var(--space-lg)',
          fontSize: 'var(--font-size-body)',
          color: 'var(--color-text-primary)',
        }}>
          确定删除 "{name}"？
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
          <button
            onClick={onCancel}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 'var(--space-xs) var(--space-lg)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            autoFocus
            style={{
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: loading ? '#a0a0a0' : '#e53e3e',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: 'var(--space-xs) var(--space-lg)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            {loading ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
