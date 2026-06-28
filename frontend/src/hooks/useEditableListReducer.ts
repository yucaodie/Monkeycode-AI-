import { useReducer, useCallback, useEffect, useRef } from 'react';

export interface EditableListState {
  editingId: number | null;
  editValue: string;
  editError: string | null;
  adding: boolean;
  newValue: string;
  newNameError: string | null;
  hoveredId: number | null;
  focusedIndex: number;
  deleteConfirmId: number | null;
  deleteConfirmName: string;
}

type EditableListAction =
  | { type: 'START_EDIT'; id: number; name: string }
  | { type: 'SET_EDIT_VALUE'; value: string }
  | { type: 'SET_EDIT_ERROR'; error: string | null }
  | { type: 'CANCEL_EDIT' }
  | { type: 'START_ADD' }
  | { type: 'SET_NEW_VALUE'; value: string }
  | { type: 'SET_NEW_ERROR'; error: string | null }
  | { type: 'CANCEL_ADD' }
  | { type: 'SET_HOVER'; id: number | null }
  | { type: 'SET_FOCUS'; index: number }
  | { type: 'SHOW_DELETE_CONFIRM'; id: number; name: string }
  | { type: 'HIDE_DELETE_CONFIRM' }
  | { type: 'CLEAR_EDITING_IF_NOT'; id: number };

const initialState: EditableListState = {
  editingId: null,
  editValue: '',
  editError: null,
  adding: false,
  newValue: '',
  newNameError: null,
  hoveredId: null,
  focusedIndex: -1,
  deleteConfirmId: null,
  deleteConfirmName: '',
};

function editableListReducer(state: EditableListState, action: EditableListAction): EditableListState {
  switch (action.type) {
    case 'START_EDIT':
      return { ...state, editingId: action.id, editValue: action.name, editError: null, adding: false, newNameError: null };
    case 'SET_EDIT_VALUE':
      return { ...state, editValue: action.value, editError: null };
    case 'SET_EDIT_ERROR':
      return { ...state, editError: action.error };
    case 'CANCEL_EDIT':
      return { ...state, editingId: null, editValue: '', editError: null };
    case 'START_ADD':
      return { ...state, adding: true, newValue: '', newNameError: null, editingId: null };
    case 'SET_NEW_VALUE':
      return { ...state, newValue: action.value, newNameError: null };
    case 'SET_NEW_ERROR':
      return { ...state, newNameError: action.error };
    case 'CANCEL_ADD':
      return { ...state, adding: false, newValue: '', newNameError: null };
    case 'SET_HOVER':
      return { ...state, hoveredId: action.id };
    case 'SET_FOCUS':
      return { ...state, focusedIndex: action.index };
    case 'SHOW_DELETE_CONFIRM':
      return { ...state, deleteConfirmId: action.id, deleteConfirmName: action.name };
    case 'HIDE_DELETE_CONFIRM':
      return { ...state, deleteConfirmId: null, deleteConfirmName: '' };
    case 'CLEAR_EDITING_IF_NOT':
      return state.editingId !== null && state.editingId !== action.id
        ? { ...state, editingId: null, editValue: '' }
        : state;
    default:
      return state;
  }
}

interface UseEditableListConfig {
  selectedId: number | null;
}

export function useEditableListReducer(config: UseEditableListConfig) {
  const [state, dispatch] = useReducer(editableListReducer, initialState);

  useEffect(() => {
    if (config.selectedId !== null) {
      dispatch({ type: 'CLEAR_EDITING_IF_NOT', id: config.selectedId });
    }
  }, [config.selectedId]);

  const startEdit = useCallback((id: number, name: string) => {
    dispatch({ type: 'START_EDIT', id, name });
  }, []);

  const setEditValue = useCallback((value: string) => {
    dispatch({ type: 'SET_EDIT_VALUE', value });
  }, []);

  const setEditError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_EDIT_ERROR', error });
  }, []);

  const cancelEdit = useCallback(() => dispatch({ type: 'CANCEL_EDIT' }), []);

  const startAdd = useCallback(() => dispatch({ type: 'START_ADD' }), []);

  const setNewValue = useCallback((value: string) => dispatch({ type: 'SET_NEW_VALUE', value }), []);

  const setNewError = useCallback((error: string | null) => dispatch({ type: 'SET_NEW_ERROR', error }), []);

  const cancelAdd = useCallback(() => dispatch({ type: 'CANCEL_ADD' }), []);

  const showDeleteConfirm = useCallback((id: number, name: string) => {
    dispatch({ type: 'SHOW_DELETE_CONFIRM', id, name });
  }, []);

  const hideDeleteConfirm = useCallback(() => dispatch({ type: 'HIDE_DELETE_CONFIRM' }), []);

  const setHovered = useCallback((id: number | null) => dispatch({ type: 'SET_HOVER', id }), []);
  const setFocusedIndex = useCallback((index: number) => dispatch({ type: 'SET_FOCUS', index }), []);

  return {
    state,
    dispatch,
    startEdit,
    setEditValue,
    setEditError,
    cancelEdit,
    startAdd,
    setNewValue,
    setNewError,
    cancelAdd,
    showDeleteConfirm,
    hideDeleteConfirm,
    setHovered,
    setFocusedIndex,
  };
}
