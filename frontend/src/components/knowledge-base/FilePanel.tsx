import { useState, useRef } from 'react';
import type { KnowledgeFile } from '../../types/knowledgeBase';

interface FilePanelProps {
  files: KnowledgeFile[];
  onUpload: (file: File, name?: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  onSelect: (file: KnowledgeFile) => void;
  selectedId: number | null;
}

const FILE_ICON: Record<string, string> = {
  md: '📝',
  docx: '📄',
  pdf: '📕',
  image: '🖼',
};

export default function FilePanel({
  files, onUpload, onRename, onDelete, onSelect, selectedId,
}: FilePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file, file.name);
    e.target.value = '';
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
        <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>文件</h3>
        <div>
          <button onClick={() => fileInputRef.current?.click()} style={{ ...btnStyle, background: '#4ecdc4', color: '#fff', border: 'none' }}>
            上传
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.docx,.pdf,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {files.map(f => (
          <div
            key={f.id}
            onClick={() => onSelect(f)}
            style={{
              padding: '10px 8px',
              cursor: 'pointer',
              borderRadius: '4px',
              background: selectedId === f.id ? '#e8f4fd' : '#fff',
              border: '1px solid ' + (selectedId === f.id ? '#4ecdc4' : '#eee'),
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
                style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}
              >
                {FILE_ICON[f.file_type] || '📁'} {f.name}
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

        {files.length === 0 && (
          <div style={{ padding: '20px', color: '#999', textAlign: 'center', fontSize: '13px' }}>
            暂无文件，点击「上传」添加
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #ddd', background: '#fff', borderRadius: '4px',
  cursor: 'pointer', padding: '4px 10px', fontSize: '13px',
};

const inputStyle: React.CSSProperties = {
  flex: 1, border: '1px solid #ccc', borderRadius: '4px',
  padding: '4px 8px', fontSize: '13px',
};
