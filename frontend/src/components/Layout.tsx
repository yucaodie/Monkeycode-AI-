import { useNavigationActions } from '../contexts/NavigationContext';
import Sidebar from './Sidebar';
import TreePanel from './TreePanel';
import ContentArea from './ContentArea';

export default function Layout() {
  const { activeView } = useNavigationActions();
  const showTreePanel = activeView === 'notes' || activeView === 'kb';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      {showTreePanel && <TreePanel />}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ContentArea />
      </main>
    </div>
  );
}
