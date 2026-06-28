import { useState, useEffect, useCallback } from 'react';
import notesService from '../../services/notesService';
import type { NotePage } from '../../types/notes';

interface Props {
  noteId: number | null;
  noteName: string;
  selectedPageId: number | null;
  onSelectPage: (pageId: number) => void;
}

interface ContextMenu {
  x: number;
  y: number;
  page: NotePage;
}

export default function PageList({ noteId, noteName, selectedPageId, onSelectPage }: Props) {
  const [pages, setPages] = useState<NotePage[]>([]);
  const [menu, setMenu] = useState<ContextMenu | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const load = useCallback(async () => {
    if (!noteId) return;
    try {
      setPages(await notesService.getPages(noteId));
    } catch (e) { console.error(e); }
  }, [noteId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreatePage() {
    if (!noteId) return;
    try {
      const page = await notesService.createPage(noteId, '新笔记页');
      onSelectPage(page.id);
      load();
    } catch (e) { console.error(e); }
  }

  function handleContextMenu(e: React.MouseEvent, page: NotePage) {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, page });
  }

  async function handleDelete(page: NotePage) {
    setMenu(null);
    if (!confirm(`确定删除「${page.title || '无标题'}」？`)) return;
    try {
      await notesService.deletePage(page.id);
      if (selectedPageId === page.id) onSelectPage(0);
      load();
    } catch (e) { console.error(e); }
  }

  function startRename(page: NotePage) {
    setMenu(null);
    setEditingId(page.id);
    setEditTitle(page.title || '');
  }

  async function finishRename(page: NotePage) {
    const title = editTitle.trim();
    if (title && title !== (page.title || '')) {
      await notesService.updatePage(page.id, { title });
      load();
    }
    setEditingId(null);
  }

  if (noteId === null) {
    return (
      <div style={{ width: '200px', minWidth: '200px', borderLeft: '1px solid #e0e0e0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
        从左侧选择笔记
      </div>
    );
  }

  return (
    <div style={{ width: '200px', minWidth: '200px', borderLeft: '1px solid #e0e0e0', background: '#fafafa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 10px', borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {noteName}
        </span>
        <button
          title="新建笔记页"
          onClick={handleCreatePage}
          style={{
            width: '22px', height: '22px', border: '1px solid #ddd', borderRadius: '4px',
            background: '#fff', cursor: 'pointer', fontSize: '13px', lineHeight: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: '4px',
          }}
        >+</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {pages.map(page => (
          <div key={page.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: selectedPageId === page.id ? '#222' : '#555',
                fontWeight: selectedPageId === page.id ? 500 : 400,
                background: selectedPageId === page.id ? '#e6f7f5' : 'transparent',
                userSelect: 'none',
              }}
              onClick={() => onSelectPage(page.id)}
              onContextMenu={e => handleContextMenu(e, page)}
            >
              <span style={{ marginRight: '6px', fontSize: '12px' }}>📄</span>
              {editingId === page.id ? (
                <input
                  autoFocus
                  style={{
                    flex: 1, border: '1px solid #4ecdc4', borderRadius: '3px',
                    padding: '1px 4px', fontSize: '12px', outline: 'none',
                  }}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => finishRename(page)}
                  onKeyDown={e => { if (e.key === 'Enter') finishRename(page); if (e.key === 'Escape') setEditingId(null); }}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {page.title || '无标题'}
                </span>
              )}
            </div>
          </div>
        ))}
        {pages.length === 0 && (
          <div style={{ padding: '20px', color: '#ccc', fontSize: '12px', textAlign: 'center' }}>
            点击 + 创建笔记页
          </div>
        )}
      </div>

      {menu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setMenu(null)}
            onContextMenu={e => { e.preventDefault(); setMenu(null); }}
          />
          <div style={{
            position: 'fixed', left: menu.x, top: menu.y, zIndex: 100,
            background: '#fff', border: '1px solid #ddd', borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '120px',
            padding: '4px 0',
          }}>
            <div style={menuItemStyle} onClick={() => startRename(menu.page)}>重命名</div>
            <div style={{ ...menuItemStyle, color: '#e55' }} onClick={() => handleDelete(menu.page)}>删除</div>
          </div>
        </>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  padding: '6px 16px', fontSize: '13px', cursor: 'pointer',
};
