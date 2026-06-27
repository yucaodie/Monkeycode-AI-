import { useState, useEffect, useCallback, useRef } from 'react';
import notesService from '../services/notesService';
import type { NotePage } from '../types/notes';
import NoteTree from '../components/notes/NoteTree';
import TipTapEditor from '../components/notes/TipTapEditor';

export default function NotesPage() {
  const [selectedPage, setSelectedPage] = useState<NotePage | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  const handleContentChange = useCallback((html: string) => {
    pendingContentRef.current = html;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      if (selectedPage && pendingContentRef.current !== null) {
        const content = pendingContentRef.current;
        notesService.updatePage(selectedPage.id, { content })
          .then(updated => setSelectedPage(updated))
          .catch(err => console.error('Auto-save failed:', err));
        pendingContentRef.current = null;
      }
    }, 2000);
  }, [selectedPage]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        if (selectedPage && pendingContentRef.current !== null) {
          notesService.updatePage(selectedPage.id, { content: pendingContentRef.current })
            .catch(err => console.error('Final save failed:', err));
        }
      }
    };
  }, [selectedPage]);

  async function handleSelectPage(pageId: number) {
    try {
      const page = await notesService.getPage(pageId);
      setSelectedPage(page);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left: NoteTree */}
      <div style={{
        width: '260px',
        minWidth: '260px',
        borderRight: '1px solid #e0e0e0',
        overflow: 'hidden',
        background: '#fafafa',
      }}>
        <NoteTree onSelectPage={handleSelectPage} />
      </div>

      {/* Right: Editor */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedPage ? (
          <>
            {/* Page header */}
            <div style={{
              padding: '8px 20px', borderBottom: '1px solid #e0e0e0',
              fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>📄</span>
              <span style={{ fontWeight: 500 }}>{selectedPage.title || '无标题'}</span>
              <span style={{ color: '#ccc', fontSize: '11px', marginLeft: 'auto' }}>
                已自动保存
              </span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <TipTapEditor
                content={selectedPage.content}
                onChange={handleContentChange}
              />
            </div>
          </>
        ) : (
          <div style={{ padding: '60px', color: '#bbb', textAlign: 'center', fontSize: '14px' }}>
            从左侧笔记树中选择一个笔记页开始编辑<br />
            <span style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              右键点击笔记本或笔记可创建新的笔记页
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
