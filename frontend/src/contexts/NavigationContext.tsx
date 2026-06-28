import { createContext, useContext, useReducer, useCallback, type ReactNode, type Dispatch } from 'react';

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
  notes: { selectedNoteId: null, selectedPageId: null },
  kb: { selectedFolderId: null, selectedFileId: null },
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

const ActiveViewContext = createContext<ActiveView>('notes');
const NotesStateContext = createContext<NavigationState['notes']>(initialState.notes);
const KbStateContext = createContext<NavigationState['kb']>(initialState.kb);
const DispatchContext = createContext<Dispatch<NavigationAction>>(() => {});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  return (
    <DispatchContext.Provider value={dispatch}>
      <ActiveViewContext.Provider value={state.activeView}>
        <NotesStateContext.Provider value={state.notes}>
          <KbStateContext.Provider value={state.kb}>
            {children}
          </KbStateContext.Provider>
        </NotesStateContext.Provider>
      </ActiveViewContext.Provider>
    </DispatchContext.Provider>
  );
}

export function useActiveView() {
  return useContext(ActiveViewContext);
}

export function useNotesState() {
  return useContext(NotesStateContext);
}

export function useKbState() {
  return useContext(KbStateContext);
}

export function useNavigate() {
  const dispatch = useContext(DispatchContext);
  return useCallback((view: ActiveView) => {
    dispatch({ type: 'NAVIGATE_TO', view });
  }, [dispatch]);
}

export function useNotesActions() {
  const dispatch = useContext(DispatchContext);
  const selectNote = useCallback((noteId: number) => {
    dispatch({ type: 'SELECT_NOTE', noteId });
  }, [dispatch]);
  const selectPage = useCallback((pageId: number) => {
    dispatch({ type: 'SELECT_PAGE', pageId });
  }, [dispatch]);
  return { selectNote, selectPage };
}

export function useKbActions() {
  const dispatch = useContext(DispatchContext);
  const selectFolder = useCallback((folderId: number) => {
    dispatch({ type: 'SELECT_FOLDER', folderId });
  }, [dispatch]);
  const selectFile = useCallback((fileId: number) => {
    dispatch({ type: 'SELECT_FILE', fileId });
  }, [dispatch]);
  return { selectFolder, selectFile };
}

export function useNavigationActions() {
  return {
    activeView: useActiveView(),
    ...useNotesState(),
    ...useKbState(),
    navigateTo: useNavigate(),
    ...useNotesActions(),
    ...useKbActions(),
  };
}
