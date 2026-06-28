import { useRef, useState, type ReactNode } from 'react';
import { useEditableListReducer } from '../../hooks/useEditableListReducer';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import SkeletonList from './SkeletonList';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import HoverActions from './HoverActions';
import NewItemInput from './NewItemInput';

export interface InlineEditableListProps<T extends { id: number; name: string }> {
  items: T[];
  loading: boolean;
  selectedId: number | null;
  getId: (item: T) => number;
  getName: (item: T) => string;
  getCount?: (item: T) => number | undefined;
  renderIcon: (item: T) => ReactNode;
  headerTitle: string;
  headerIcon: string;
  newItemPlaceholder: string;
  emptyGuide: string;
  onSelect: (id: number) => void;
  onRename: (id: number, name: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onCreate: (name: string) => Promise<boolean>;
  validateName: (name: string, items: T[], editingId?: number | null) => string | null;
}

export default function InlineEditableList<T extends { id: number; name: string }>(
  props: InlineEditableListProps<T>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const list = useEditableListReducer({
    selectedId: props.selectedId,
  });

  const { state } = list;

  const commitEdit = async (id: number) => {
    const name = state.editValue.trim();
    const error = props.validateName(name, props.items, id);
    if (error) {
      list.setEditError(error);
      return;
    }
    setRenaming(true);
    const ok = await props.onRename(id, name);
    setRenaming(false);
    if (ok) {
      list.cancelEdit();
    }
  };

  const commitAdd = async () => {
    const name = state.newValue.trim();
    const error = props.validateName(name, props.items);
    if (error) {
      list.setNewError(error);
      return;
    }
    const ok = await props.onCreate(name);
    if (ok) {
      list.cancelAdd();
    }
  };

  const confirmDelete = async () => {
    if (state.deleteConfirmId === null || deleting) return;
    const id = state.deleteConfirmId;
    setDeleting(true);
    await props.onDelete(id);
    setDeleting(false);
    list.hideDeleteConfirm();
  };

  const { handleKeyDown } = useKeyboardNav({
    itemCount: props.items.length,
    focusedIndex: state.focusedIndex,
    editingId: state.editingId,
    adding: state.adding,
    setFocusedIndex: list.setFocusedIndex,
    onSelectIndex: (index) => {
      const item = props.items[index];
      if (item) {
        if (props.selectedId === item.id) {
          list.startEdit(item.id, props.getName(item));
        } else {
          props.onSelect(item.id);
        }
      }
    },
    onStartEditIndex: (index) => {
      const item = props.items[index];
      if (item) list.startEdit(item.id, props.getName(item));
    },
    onDeleteIndex: (index) => {
      const item = props.items[index];
      if (item) list.showDeleteConfirm(item.id, props.getName(item));
    },
    onCancel: () => {
      if (state.editingId !== null) list.cancelEdit();
      if (state.adding) list.cancelAdd();
    },
    containerRef,
  });

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
        }}>{props.headerIcon} {props.headerTitle}</span>
        <button
          onClick={list.startAdd}
          title="新建"
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

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xs)', outline: 'none' }}
      >
        {props.loading ? (
          <SkeletonList />
        ) : (
          <>
            {state.adding && (
              <NewItemInput
                value={state.newValue}
                placeholder={props.newItemPlaceholder}
                error={state.newNameError}
                onChange={list.setNewValue}
                onCommit={commitAdd}
                onCancel={list.cancelAdd}
              />
            )}

            {props.items.map((item, index) => {
              const id = props.getId(item);
              const name = props.getName(item);
              const count = props.getCount?.(item);
              const isSelected = props.selectedId === id;
              const isEditing = state.editingId === id;
              const isHovered = state.hoveredId === id;
              const isFocused = state.focusedIndex === index;

              return (
                <div
                  key={id}
                  onClick={() => {
                    if (isEditing) return;
                    if (isSelected) list.startEdit(id, name);
                    else props.onSelect(id);
                  }}
                  onDoubleClick={() => {
                    if (!isEditing) list.startEdit(id, name);
                  }}
                  onMouseEnter={() => list.setHovered(id)}
                  onMouseLeave={() => list.setHovered(null)}
                  style={{
                    padding: 'var(--space-sm)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '2px',
                    background: isSelected ? 'var(--color-bg-selected)'
                      : isHovered ? 'var(--color-bg-hover)'
                      : 'transparent',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    outline: isFocused && !isEditing ? '1px solid var(--color-primary)' : 'none',
                    outlineOffset: '-1px',
                  }}
                >
                  {isEditing ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <input
                        value={state.editValue}
                        onChange={e => list.setEditValue(e.target.value)}
                        onBlur={() => commitEdit(id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit(id);
                          if (e.key === 'Escape') list.cancelEdit();
                        }}
                        autoFocus
                        disabled={renaming}
                        style={{
                          border: `1px solid ${state.editError ? '#e53e3e' : 'var(--color-primary)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          fontSize: 'var(--font-size-small)',
                          background: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                      {state.editError && (
                        <div style={{
                          fontSize: 'var(--font-size-small)',
                          color: '#e53e3e',
                        }}>
                          {state.editError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <span
                        title={name}
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 'var(--font-size-small)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-xs)',
                        }}
                      >
                        {props.renderIcon(item)}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                      </span>
                      {count != null && (
                        <span style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-text-tertiary)',
                          marginLeft: 'var(--space-xs)',
                          flexShrink: 0,
                        }}>
                          {count}
                        </span>
                      )}
                      <HoverActions
                        visible={isHovered || isSelected}
                        disabled={renaming || state.adding}
                        onRename={() => list.startEdit(id, name)}
                        onDelete={() => list.showDeleteConfirm(id, name)}
                      />
                    </>
                  )}
                </div>
              );
            })}

            {props.items.length === 0 && !state.adding && (
              <div style={{
                padding: 'var(--space-lg)',
                color: 'var(--color-text-tertiary)',
                fontSize: 'var(--font-size-small)',
                textAlign: 'center',
              }}>
                {props.emptyGuide}
              </div>
            )}
          </>
        )}
      </div>

      {state.deleteConfirmId !== null && (
        <DeleteConfirmDialog
          name={state.deleteConfirmName}
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={list.hideDeleteConfirm}
        />
      )}
    </div>
  );
}
