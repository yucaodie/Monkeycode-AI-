import { useActiveView } from '../contexts/NavigationContext';
import ResizablePanels from './ResizablePanels';
import Sidebar from './Sidebar';
import TreePanel from './TreePanel';
import ContentArea from './ContentArea';

export default function Layout() {
  const activeView = useActiveView();
  const showTreePanel = activeView === 'notes' || activeView === 'kb';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      {showTreePanel ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
        <ResizablePanels
          direction="horizontal"
          defaultRatios={[0.233, 0.767]}
          minSizes={[200, 400]}
          storageKey="layout-tree-panel"
        >
          <TreePanel />
          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ContentArea />
          </main>
        </ResizablePanels>
        </div>
      ) : (
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ContentArea />
        </main>
      )}
    </div>
  );
}
