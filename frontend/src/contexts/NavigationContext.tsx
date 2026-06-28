import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';

export type ActiveView = 'notes' | 'kb' | 'qa' | 'output' | 'settings';

export interface NavigationState {
  activeView: ActiveView;

  notes: {
    selectedNoteId: number | null;
    selectedPageId: number | null;
  };

  kb: {
    selectedFolderId: number | null;
    selectedFileId: number | null;
  };
}

type NavigationAction =
  | { type: 'NAVIGATE_TO'; view: ActiveView }
  | { type: 'SELECT_NOTE'; noteId: number }
  | { type: 'SELECT_PAGE'; pageId: number }
  | { type: 'SELECT_FOLDER'; folderId: number }
  | { type: 'SELECT_FILE'; fileId: number };

const initialState: NavigationState = {
  activeView: 'notes',
  notes: {
    selectedNoteId: null,
    selectedPageId: null,
  },
  kb: {
    selectedFolderId: null,
    selectedFileId: null,
  },
};

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NAVIGATE_TO':
      return { ...state, activeView: action.view };

    case 'SELECT_NOTE':
      return {
        ...state,
        activeView: 'notes',
        notes: { selectedNoteId: action.noteId, selectedPageId: null },
      };

    case 'SELECT_PAGE':
      return {
        ...state,
        notes: { ...state.notes, selectedPageId: action.pageId },
      };

    case 'SELECT_FOLDER':
      return {
        ...state,
        activeView: 'kb',
        kb: { selectedFolderId: action.folderId, selectedFileId: null },
      };

    case 'SELECT_FILE':
      return {
        ...state,
        kb: { ...state.kb, selectedFileId: action.fileId },
      };

    default:
      return state;
  }
}

interface NavigationContextValue {
  state: NavigationState;
  dispatch: Dispatch<NavigationAction>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return ctx;
}

export function useNavigationActions() {
  const { dispatch, state } = useNavigation();

  return {
    activeView: state.activeView,
    selectedNoteId: state.notes.selectedNoteId,
    selectedPageId: state.notes.selectedPageId,
    selectedFolderId: state.kb.selectedFolderId,
    selectedFileId: state.kb.selectedFileId,

    navigateTo(view: ActiveView) {
      dispatch({ type: 'NAVIGATE_TO', view });
    },

    selectNote(noteId: number) {
      dispatch({ type: 'SELECT_NOTE', noteId });
    },

    selectPage(pageId: number) {
      dispatch({ type: 'SELECT_PAGE', pageId });
    },

    selectFolder(folderId: number) {
      dispatch({ type: 'SELECT_FOLDER', folderId });
    },

    selectFile(fileId: number) {
      dispatch({ type: 'SELECT_FILE', fileId });
    },
  };
}
