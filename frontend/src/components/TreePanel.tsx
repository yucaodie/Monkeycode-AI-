import ResizablePanels from './ResizablePanels';
import NoteTree from './notes/NoteTree';
import FolderList from './knowledge-base/FolderList';

export default function TreePanel() {
  return (
    <div style={{
      height: '100%',
      background: 'var(--color-bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <ResizablePanels
        direction="vertical"
        defaultRatios={[0.5, 0.5]}
        minSizes={[120, 120]}
        storageKey="tree-panel-ratio"
      >
        <NoteTree />
        <FolderList />
      </ResizablePanels>
    </div>
  );
}
