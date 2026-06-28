import { useState, useEffect, useCallback } from 'react';
import notesService from '../../services/notesService';
import { useNotesState, useNotesActions } from '../../contexts/NavigationContext';

interface Notebook {
  id: number;
  name: string;
  sort_order: number;
  note_count?: number;
}

export default function NoteTree() {
  const { selectedNoteId } = useNotesState();
  const { selectNote } = useNotesActions();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try { setNotebooks((await notesService.getNotebooks()).reverse()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    if (notebooks.some(nb => nb.name === name)) { alert('同名笔记本已存在'); return; }
    try {
      const nb = await notesService.createNotebook(name);
      setNotebooks(prev => [nb, ...prev]);
      setNewName(''); setShowNew(false);
    } catch (e) { console.error(e); }
  }

  async function handleRename(id: number) {
    const name = editName.trim();
    if (!name) { setEditingId(null); return; }
    try {
      const nb = await notesService.updateNotebook(id, { name });
      setNotebooks(prev => prev.map(n => n.id === id ? nb : n));
      setEditingId(null);
    } catch (e) { console.error(e); }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除此笔记本？')) return;
    try {
      await notesService.deleteNotebook(id);
      setNotebooks(prev => prev.filter(n => n.id !== id));
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'transparent',
    }}>
      <div style={{
        padding: 'var(--space-sm) var(--space-md)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 'var(--font-size-small)',
          fontWeight: 'var(--font-weight-semibold)',
          flex: 1,
          color: 'var(--color-text-secondary)',
        }}>{'\uD83D\uDCD3'} 笔记树</span>
        <button
          onClick={() => setShowNew(!showNew)}
          title="新建笔记本"
          style={{
            width: 22, height: 22,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}
        >+</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xs)' }}>
        {showNew && (
          <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="笔记本名称"
              autoFocus
              style={{
                flex: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                fontSize: 'var(--font-size-small)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            <button onClick={handleCreate} style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 'var(--space-xs) var(--space-sm)',
              fontSize: 'var(--font-size-small)',
            }}>OK</button>
          </div>
        )}

        {notebooks.map(nb => (
          <div
            key={nb.id}
            onClick={() => {
              if (selectedNoteId === nb.id) { setEditingId(nb.id); setEditName(nb.name); }
              else selectNote(nb.id);
            }}
            onMouseEnter={() => setHoveredId(nb.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              padding: 'var(--space-sm)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2px',
              background: selectedNoteId === nb.id ? 'var(--color-bg-selected)'
                : hoveredId === nb.id ? 'var(--color-bg-hover)'
                : 'transparent',
              transition: 'background 0.15s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: selectedNoteId === nb.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
            }}
          >
            {editingId === nb.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleRename(nb.id)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(nb.id); if (e.key === 'Escape') setEditingId(null); }}
                autoFocus
                style={{
                  flex: 1,
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  fontSize: 'var(--font-size-small)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                title={nb.name}
                onDoubleClick={() => { setEditingId(nb.id); setEditName(nb.name); }}
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 'var(--font-size-small)',
                }}
              >
                {'\uD83D\uDCD3'} {nb.name}
              </span>
            )}
            {nb.note_count != null && (
              <span style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-text-tertiary)',
                marginLeft: 'var(--space-xs)',
                flexShrink: 0,
              }}>
                {nb.note_count}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); handleDelete(nb.id); }}
              title="删除笔记本"
              style={{
                border: 'none', background: 'transparent',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer', fontSize: 'var(--font-size-small)',
                padding: 'var(--space-xs)',
                visibility: selectedNoteId === nb.id ? 'visible' : 'hidden',
              }}
            >{'✕'}</button>
          </div>
        ))}

        {notebooks.length === 0 && !showNew && (
          <div style={{
            padding: 'var(--space-lg)',
            color: 'var(--color-text-tertiary)',
            fontSize: 'var(--font-size-small)',
            textAlign: 'center',
          }}>
            点击 + 创建笔记本
          </div>
        )}
      </div>
    </div>
  );
}
