import { useActiveView, useNotesState, useKbState } from '../contexts/NavigationContext';
import NotesWorkspace from './NotesWorkspace';
import KBWorkspace from './KBWorkspace';
import QAPage from '../pages/QAPage';
import OutputPage from '../pages/OutputPage';
import SettingsPage from '../pages/SettingsPage';

export default function ContentArea() {
  const activeView = useActiveView();
  const { selectedNoteId } = useNotesState();
  const { selectedFolderId } = useKbState();

  switch (activeView) {
    case 'notes':
      return selectedNoteId ? (
        <NotesWorkspace />
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-body)',
          height: '100%',
        }}>
          请从侧边栏选择笔记本
        </div>
      );

    case 'kb':
      return selectedFolderId ? (
        <KBWorkspace />
      ) : (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-body)',
          height: '100%',
        }}>
          请从侧边栏选择文件夹
        </div>
      );

    case 'qa':
      return <QAPage />;

    case 'output':
      return <OutputPage />;

    case 'settings':
      return <SettingsPage />;

    default:
      return null;
  }
}
