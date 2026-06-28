import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardNavConfig {
  itemCount: number;
  focusedIndex: number;
  editingId: number | null;
  adding: boolean;
  setFocusedIndex: (index: number) => void;
  onSelectIndex: (index: number) => void;
  onStartEditIndex: (index: number) => void;
  onDeleteIndex: (index: number) => void;
  onCancel: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function useKeyboardNav(config: UseKeyboardNavConfig) {
  const {
    itemCount, editingId, adding,
    setFocusedIndex, onSelectIndex, onStartEditIndex, onDeleteIndex, onCancel,
    containerRef,
  } = config;

  const focusedIndexRef = useRef(config.focusedIndex);
  focusedIndexRef.current = config.focusedIndex;

  const handleFocus = useCallback(() => {
    if (focusedIndexRef.current < 0 && itemCount > 0) {
      setFocusedIndex(0);
    }
  }, [itemCount, setFocusedIndex]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('focus', handleFocus);
    return () => el.removeEventListener('focus', handleFocus);
  }, [containerRef, handleFocus]);

  const focusedIndex = config.focusedIndex;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isEditing = editingId !== null || adding;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (isEditing) return;
        setFocusedIndex(focusedIndex <= 0 ? itemCount - 1 : focusedIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (isEditing) return;
        setFocusedIndex(focusedIndex >= itemCount - 1 ? 0 : focusedIndex + 1);
        break;
      case 'Enter':
        if (isEditing) return;
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          onSelectIndex(focusedIndex);
        }
        break;
      case 'F2':
        e.preventDefault();
        if (isEditing) return;
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          onStartEditIndex(focusedIndex);
        }
        break;
      case 'Home':
        e.preventDefault();
        if (isEditing) return;
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (isEditing) return;
        setFocusedIndex(itemCount - 1);
        break;
        if (isEditing) return;
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          onDeleteIndex(focusedIndex);
        }
        break;
      case 'Escape':
        if (isEditing) {
          e.preventDefault();
          onCancel();
        }
        break;
    }
  }, [focusedIndex, itemCount, editingId, adding, setFocusedIndex, onSelectIndex, onStartEditIndex, onDeleteIndex, onCancel]);

  return { handleKeyDown };
}
