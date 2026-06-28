import { useRef, useEffect } from 'react';

interface NewItemInputProps {
  value: string;
  placeholder: string;
  error: string | null;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

export default function NewItemInput({ value, placeholder, error, onChange, onCommit, onCancel }: NewItemInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={{
      marginBottom: 'var(--space-xs)',
      overflow: 'hidden',
      animation: 'slide-down 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); onCommit(); }
            if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
          }}
          onBlur={() => {
            if (!value.trim()) onCancel();
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: `1px solid ${error ? '#e53e3e' : 'var(--color-primary)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-xs) var(--space-sm)',
            fontSize: 'var(--font-size-small)',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
      </div>
      {error && (
        <div style={{
          fontSize: 'var(--font-size-small)',
          color: '#e53e3e',
          marginTop: 'var(--space-xs)',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
