import { useState, useEffect, useCallback, useRef } from 'react';
import type { KnowledgeFolder } from '../../types/knowledgeBase';
import kbService from '../../services/kbService';
import { useNavigationActions } from '../../contexts/NavigationContext';

export default function FolderList() {
  const { selectedFolderId, selectFolder } = useNavigationActions();
  const [folders, setFolders] = useState<KnowledgeFolder[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try { setFolders(await kbService.getFolders()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    try { await kbService.createFolder(newName.trim()); setNewName(''); setShowNew(false); load(); } catch (e) { console.error(e); }
  }

  async function handleRename(id: number) {
    if (!editName.trim()) { setEditingId(null); return; }
    try { await kbService.updateFolder(id, { name: editName.trim() }); setEditingId(null); load(); } catch (e) { console.error(e); }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定删除此文件夹？')) return;
    try { await kbService.deleteFolder(id); load(); } catch (e) { console.error(e); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedFolderId) return;
    try {
      await kbService.uploadFile(selectedFolderId, file);
      load();
    } catch (err) { console.error(err); }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        }}>{'\uD83D\uDCC1'} 知识库</span>
        <button
          onClick={() => setShowNew(!showNew)}
          title="新建文件夹"
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
              placeholder="文件夹名"
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

        {folders.map(f => (
          <div
            key={f.id}
            onClick={() => selectFolder(f.id)}
            style={{
              padding: 'var(--space-sm)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '2px',
              background: selectedFolderId === f.id ? 'var(--color-bg-selected)' : 'transparent',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: selectedFolderId === f.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
            }}
          >
            {editingId === f.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleRename(f.id)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(f.id); if (e.key === 'Escape') setEditingId(null); }}
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
                title={f.name}
                onDoubleClick={() => { setEditingId(f.id); setEditName(f.name); }}
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: 'var(--font-size-small)',
                }}
              >
                {'\uD83D\uDCC1'} {f.name}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); handleDelete(f.id); }}
              title="删除文件夹"
              style={{
                border: 'none', background: 'transparent',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer', fontSize: 'var(--font-size-small)',
                padding: 'var(--space-xs)',
                visibility: selectedFolderId === f.id ? 'visible' : 'hidden',
              }}
            >{'✕'}</button>
          </div>
        ))}

        {folders.length === 0 && !showNew && (
          <div style={{
            padding: 'var(--space-lg)',
            color: 'var(--color-text-tertiary)',
            fontSize: 'var(--font-size-small)',
            textAlign: 'center',
          }}>
            点击 + 创建文件夹
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
