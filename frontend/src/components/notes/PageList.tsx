import InlineEditableList from './InlineEditableList';

export interface PageWithNote {
  id: number;
  title: string;
  content: string;
  noteId: number;
  noteName: string;
}

interface PageListProps {
  pages: PageWithNote[];
  loadingPages: boolean;
  selectedPageId: number | null;
  onSelect: (id: number) => void;
  onRename: (id: number, title: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onCreate: (name: string) => Promise<boolean>;
}

export default function PageList({
  pages, loadingPages, selectedPageId, onSelect, onRename, onDelete, onCreate,
}: PageListProps) {
  return (
    <InlineEditableList<PageWithNote>
      items={pages}
      loading={loadingPages}
      selectedId={selectedPageId}
      getId={p => p.id}
      getName={p => p.title}
      renderIcon={() => '\uD83D\uDCC4'}
      headerTitle="笔记页"
      headerIcon={'\uD83D\uDCC4'}
      newItemPlaceholder="笔记页标题"
      emptyGuide="点击 + 创建笔记页"
      onSelect={onSelect}
      onRename={onRename}
      onDelete={onDelete}
      onCreate={onCreate}
      validateName={(name, items, editingId) => {
        if (!name.trim()) return '标题不能为空';
        const editingItem = items.find(p => p.id === editingId);
        const noteId = editingItem?.noteId;
        if (items.some(p => p.title === name.trim() && p.noteId === noteId && p.id !== editingId))
          return '同名笔记页已存在';
        return null;
      }}
    />
  );
}
