import { useState } from 'react';
import type { KnowledgeFolder } from '../../types/knowledgeBase';

interface FolderListProps {
  folders: KnowledgeFolder[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCreate: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export default function FolderList({
  folders, selectedId, onSelect, onCreate, onRename, onDelete,
}: FolderListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  function handleCreate() {
    if (newName.trim()) { onCreate(newName.trim()); setNewName(''); setShowNew(false); }
  }

  function handleRename(id: number) {
    if (editName.trim()) { onRename(id, editName.trim()); setEditingId(null); }
  }

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>文件夹</h3>
        <button onClick={() => setShowNew(!showNew)} style={btnStyle}>+</button>
      </div>

      {showNew && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="文件夹名"
            autoFocus
            style={inputStyle}
          />
          <button onClick={handleCreate} style={btnStyle}>OK</button>
        </div>
      )}

      {folders.map(f => (
        <div
          key={f.id}
          onClick={() => onSelect(f.id)}
          style={{
            padding: '8px',
            cursor: 'pointer',
            borderRadius: '4px',
            marginBottom: '2px',
            background: selectedId === f.id ? '#e8f4fd' : 'transparent',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {editingId === f.id ? (
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => handleRename(f.id)}
              onKeyDown={e => e.key === 'Enter' && handleRename(f.id)}
              autoFocus
              style={inputStyle}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              onDoubleClick={() => { setEditingId(f.id); setEditName(f.name); }}
              style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              📁 {f.name}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(f.id); }}
            style={{ ...btnStyle, color: '#e55', fontSize: '11px', padding: '1px 5px' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #ddd', background: '#fff', borderRadius: '4px',
  cursor: 'pointer', padding: '2px 8px', fontSize: '13px',
};

const inputStyle: React.CSSProperties = {
  flex: 1, border: '1px solid #ccc', borderRadius: '4px',
  padding: '4px 8px', fontSize: '13px',
};
