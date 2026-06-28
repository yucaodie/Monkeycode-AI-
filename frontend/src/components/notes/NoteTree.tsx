import { useState, useEffect, useCallback, useRef } from 'react';
import notesService from '../../services/notesService';
import { useNotesState, useNotesActions } from '../../contexts/NavigationContext';
import InlineEditableList from './InlineEditableList';

interface Notebook {
  id: number;
  name: string;
  sort_order: number;
  note_count?: number;
}

export default function NoteTree() {
  const { selectedNoteId, notebooksVersion } = useNotesState();
  const { selectNote, deselectNote } = useNotesActions();
  const [items, setItems] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await notesService.getNotebooks()).reverse());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, notebooksVersion]);

  return (
    <InlineEditableList<Notebook>
      items={items}
      loading={loading}
      selectedId={selectedNoteId}
      getId={n => n.id}
      getName={n => n.name}
      getCount={n => n.note_count}
      renderIcon={() => '\uD83D\uDCD3'}
      headerTitle="笔记本"
      headerIcon={'\uD83D\uDCD3'}
      newItemPlaceholder="笔记本名称"
      emptyGuide="点击 + 创建笔记本"
      onSelect={id => selectNote(id)}
      onRename={useCallback(async (id: number, name: string) => {
        const prev = itemsRef.current.find(n => n.id === id);
        const prevName = prev?.name || '';
        setItems(prevList => prevList.map(n => n.id === id ? { ...n, name } : n));
        try {
          await notesService.updateNotebook(id, { name });
          return true;
        } catch {
          setItems(prevList => prevList.map(n => n.id === id ? { ...n, name: prevName } : n));
          return false;
        }
      }, [])}
      onDelete={async (id) => {
        try {
          await notesService.deleteNotebook(id);
          setItems(prev => prev.filter(n => n.id !== id));
          if (selectedNoteId === id) deselectNote();
          return true;
        } catch { return false; }
      }}
      onCreate={async (name) => {
        try {
          const nb = await notesService.createNotebook(name);
          setItems(prev => [{ ...nb, note_count: 0 }, ...prev]);
          return true;
        } catch { return false; }
      }}
      validateName={(name, items, editingId) => {
        if (!name.trim()) return '名称不能为空';
        if (items.some(n => n.name === name.trim() && n.id !== editingId)) return '同名笔记本已存在';
        return null;
      }}
    />
  );
}
