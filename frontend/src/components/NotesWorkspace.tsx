import { useState, useEffect, useCallback, useRef } from 'react';
import notesService from '../services/notesService';
import type { NotePage } from '../types/notes';
import { useNavigationActions } from '../contexts/NavigationContext';
import ResizablePanels from './ResizablePanels';
import TipTapEditor from './notes/TipTapEditor';

interface PageWithNote {
  id: number;
  title: string;
  content: string;
  noteId: number;
  noteName: string;
}

export default function NotesWorkspace() {
  const { selectedNoteId, selectedPageId, selectPage } = useNavigationActions();
  const [pages, setPages] = useState<PageWithNote[]>([]);
  const [selectedPage, setSelectedPage] = useState<NotePage | null>(null);
  const [notebookName, setNotebookName] = useState('');
  const [firstNoteId, setFirstNoteId] = useState<number | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedNoteId) {
      setPages([]);
      setNotebookName('');
      setSelectedPage(null);
      setFirstNoteId(null);
      return;
    }
    // selectedNoteId is now a notebook ID
    (async () => {
      try {
        const notes = await notesService.getNotes(selectedNoteId);
        if (notes.length === 0) {
          setPages([]);
          setNotebookName('');
          setFirstNoteId(null);
          return;
        }

        setNotebookName('');
        setFirstNoteId(notes[0].id);

        const allPages: PageWithNote[] = [];
        for (const note of notes) {
          try {
            const notePages = await notesService.getPages(note.id);
            for (const p of notePages) {
              allPages.push({
                id: p.id,
                title: p.title || '无标题',
                content: p.content || '',
                noteId: note.id,
                noteName: note.name,
              });
            }
          } catch { /* skip notes with no pages */ }
        }
        setPages(allPages);
      } catch (e) { console.error(e); }
    })();
  }, [selectedNoteId]);

  useEffect(() => {
    if (!selectedPageId) {
      setSelectedPage(null);
      return;
    }
    notesService.getPage(selectedPageId).then(setSelectedPage).catch(console.error);
  }, [selectedPageId]);

  const handleContentChange = useCallback((html: string) => {
    pendingContentRef.current = html;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (selectedPage && pendingContentRef.current !== null) {
        const content = pendingContentRef.current;
        notesService.updatePage(selectedPage.id, { content })
          .then(updated => setSelectedPage(updated))
          .catch(console.error);
        pendingContentRef.current = null;
      }
    }, 2000);
  }, [selectedPage]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  async function handleCreatePage() {
    if (!selectedNoteId || !firstNoteId) return;
    try {
      const page = await notesService.createPage(firstNoteId, '新笔记页');
      selectPage(page.id);
      setPages(prev => [...prev, {
        id: page.id,
        title: page.title || '无标题',
        content: page.content || '',
        noteId: firstNoteId,
        noteName: '',
      }]);
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {selectedNoteId ? (
        <ResizablePanels
          direction="horizontal"
          defaultRatios={[0.25, 0.75]}
          minSizes={[180, 300]}
          storageKey="panel-ratio-notes"
          className="resizable-horizontal workspace-notes"
        >
          <div style={{
            display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
            background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)',
          }}>
            <div style={{
              padding: 'var(--space-sm) var(--space-md)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
            }}>
              <span style={{
                fontSize: 'var(--font-size-small)', fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-secondary)', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {notebookName || '笔记页'}
              </span>
              <button
                title="新建笔记页"
                onClick={handleCreatePage}
                style={{
                  width: 22, height: 22,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer', fontSize: 'var(--font-size-small)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {pages.map(page => (
                <div
                  key={page.id}
                  onClick={() => selectPage(page.id)}
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-small)',
                    color: selectedPageId === page.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: selectedPageId === page.id ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                    background: selectedPageId === page.id ? 'var(--color-bg-selected)' : 'transparent',
                    userSelect: 'none',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
                  }}
                >
                  <span>📄</span>
                  <span
                    title={page.title}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {page.title || '无标题'}
                  </span>
                </div>
              ))}
              {pages.length === 0 && (
                <div style={{
                  padding: 'var(--space-xl)', color: 'var(--color-text-tertiary)',
                  fontSize: 'var(--font-size-small)', textAlign: 'center',
                }}>
                  点击 + 创建笔记页
                </div>
              )}
            </div>
          </div>

          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedPage ? (
              <>
                <div style={{
                  padding: 'var(--space-sm) var(--space-xl)',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: 'var(--font-size-small)',
                  color: 'var(--color-text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                  background: 'var(--color-bg-primary)',
                }}>
                  <span>📄</span>
                  <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    {selectedPage.title || '无标题'}
                  </span>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <TipTapEditor content={selectedPage.content} onChange={handleContentChange} />
                </div>
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-body)',
              }}>
                从左侧选择笔记页开始编辑
              </div>
            )}
          </div>
        </ResizablePanels>
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-body)',
        }}>
          请从侧边栏选择笔记本
        </div>
      )}
    </div>
  );
}
