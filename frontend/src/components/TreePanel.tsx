import ResizablePanels from './ResizablePanels';
import NoteTree from './notes/NoteTree';
import FolderList from './knowledge-base/FolderList';

export default function TreePanel() {
  return (
    <div style={{
      width: 280,
      minWidth: 280,
      height: '100%',
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--color-border)',
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
