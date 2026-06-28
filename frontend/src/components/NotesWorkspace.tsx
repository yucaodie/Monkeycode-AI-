import { useState, useEffect, useCallback, useRef } from 'react';
import notesService from '../services/notesService';
import type { NotePage } from '../types/notes';
import { useNotesState, useNotesActions } from '../contexts/NavigationContext';
import ResizablePanels from './ResizablePanels';
import TipTapEditor from './notes/TipTapEditor';
import PageList from './notes/PageList';
import type { PageWithNote } from './notes/PageList';

export type { PageWithNote };

export default function NotesWorkspace() {
  const { selectedNoteId, selectedPageId } = useNotesState();
  const { selectPage, refreshNotebooks } = useNotesActions();
  const [pages, setPages] = useState<PageWithNote[]>([]);
  const [selectedPage, setSelectedPage] = useState<NotePage | null>(null);
  const [loadingPages, setLoadingPages] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  const fetchIdRef = useRef(0);
  const notesRef = useRef<{ id: number; name: string }[]>([]);
  const selectedPageRef = useRef<NotePage | null>(null);
  selectedPageRef.current = selectedPage;

  useEffect(() => {
    if (!selectedNoteId) {
      setPages([]);
      setSelectedPage(null);
      setLoadingPages(false);
      notesRef.current = [];
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoadingPages(true);

    (async () => {
      try {
        const notebookPages = await notesService.getNotebookPages(selectedNoteId);
        if (fetchId !== fetchIdRef.current) return;

        const newPages = notebookPages.map(p => ({
          id: p.id,
          title: p.title || '无标题',
          content: '',
          noteId: p.note_id,
          noteName: p.note_name,
        }));

        const noteMap = new Map<number, string>();
        for (const p of notebookPages) {
          noteMap.set(p.note_id, p.note_name);
        }
        notesRef.current = Array.from(noteMap.entries()).map(([id, name]) => ({ id, name }));

        setPages(newPages);
      } catch (e) {
        if (fetchId === fetchIdRef.current) console.error(e);
      }
      if (fetchId === fetchIdRef.current) setLoadingPages(false);
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
      const page = selectedPageRef.current;
      if (page && pendingContentRef.current !== null) {
        const content = pendingContentRef.current;
        notesService.updatePage(page.id, { content })
          .then(updated => { if (selectedPageRef.current?.id === page.id) setSelectedPage(updated); })
          .catch(console.error);
        pendingContentRef.current = null;
      }
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleCreatePage = useCallback(async (name?: string): Promise<boolean> => {
    if (!selectedNoteId) return false;
    let newNoteId: number | null = null;
    try {
      let targetNoteId: number;
      let noteName: string;
      if (notesRef.current.length > 0) {
        targetNoteId = notesRef.current[0].id;
        noteName = notesRef.current[0].name;
      } else {
        noteName = '新笔记';
        let counter = 1;
        while (notesRef.current.some(n => n.name === noteName)) {
          counter++;
          noteName = `新笔记${counter}`;
        }
        const note = await notesService.createNote(selectedNoteId, noteName);
        notesRef.current = [{ id: note.id, name: noteName }, ...notesRef.current];
        targetNoteId = note.id;
        newNoteId = note.id;
        refreshNotebooks();
      }

      let pageTitle = name || '新笔记页';
      if (!name) {
        let num = 1;
        while (pages.some(p => p.noteId === targetNoteId && p.title === pageTitle)) {
          num++;
          pageTitle = `新笔记页${num}`;
        }
      }

      const page = await notesService.createPage(targetNoteId, pageTitle);
      selectPage(page.id);

      const newPage: PageWithNote = {
        id: page.id,
        title: page.title || '无标题',
        content: page.content || '',
        noteId: targetNoteId,
        noteName,
      };

      setPages(prev => [newPage, ...prev]);
      refreshNotebooks();

      return true;
    } catch (e) {
      console.error(e);
      if (newNoteId !== null) {
        try { await notesService.deleteNote(newNoteId); } catch {}
        refreshNotebooks();
      }
      return false;
    }
  }, [selectedNoteId, pages, selectPage, refreshNotebooks]);

  const handleRenamePage = useCallback(async (id: number, title: string): Promise<boolean> => {
    try {
      await notesService.updatePage(id, { title });
      setPages(prev => prev.map(p => p.id === id ? { ...p, title } : p));
      if (selectedPageId === id) {
        setSelectedPage(prev => prev ? { ...prev, title } : null);
      }
      return true;
    } catch { return false; }
  }, [selectedPageId]);

  const handleDeletePage = useCallback(async (id: number): Promise<boolean> => {
    try {
      await notesService.deletePage(id);
      setPages(prev => prev.filter(p => p.id !== id));
      refreshNotebooks();
      return true;
    } catch { return false; }
  }, [refreshNotebooks]);

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
            <PageList
              pages={pages}
              loadingPages={loadingPages}
              selectedPageId={selectedPageId}
              onSelect={selectPage}
              onRename={handleRenamePage}
              onDelete={handleDeletePage}
              onCreate={(name) => handleCreatePage(name)}
            />
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
                  <span>{'\uD83D\uDCC4'}</span>
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
