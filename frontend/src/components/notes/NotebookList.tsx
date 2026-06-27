import { useState } from 'react';
import type { Notebook } from '../../types/notes';

interface NotebookListProps {
  notebooks: Notebook[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export default function NotebookList({
  notebooks, selectedId, onSelect, onCreate, onRename, onDelete,
}: NotebookListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  function handleCreate() {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setShowNew(false);
    }
  }

  function handleRename(id: number) {
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
    }
  }

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>笔记本</h3>
        <button
          onClick={() => setShowNew(!showNew)}
          style={btnStyle}
        >
          +
        </button>
      </div>

      {showNew && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="笔记本名称"
            autoFocus
            style={inputStyle}
          />
          <button onClick={handleCreate} style={btnStyle}>OK</button>
        </div>
      )}

      <div>
        {notebooks.map(nb => (
          <div
            key={nb.id}
            onClick={() => onSelect(nb.id)}
            style={{
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '4px',
              marginBottom: '2px',
              background: selectedId === nb.id ? '#e8f4fd' : 'transparent',
              fontWeight: selectedId === nb.id ? 600 : 400,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {editingId === nb.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleRename(nb.id)}
                onKeyDown={e => e.key === 'Enter' && handleRename(nb.id)}
                autoFocus
                style={inputStyle}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={() => { setEditingId(nb.id); setEditName(nb.name); }}
                style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                📓 {nb.name}
              </span>
            )}

            {selectedId === nb.id && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(nb.id); }}
                style={{ ...btnStyle, color: '#e55', fontSize: '12px', padding: '2px 6px' }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  background: '#fff',
  borderRadius: '4px',
  cursor: 'pointer',
  padding: '2px 8px',
  fontSize: '13px',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid #ccc',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '13px',
};
