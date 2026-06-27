import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import NotesPage from './pages/NotesPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import OutputPage from './pages/OutputPage';
import QAPage from './pages/QAPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/notes" replace />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="output" element={<OutputPage />} />
          <Route path="qa" element={<QAPage />} />
          <Route path="settings/models" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
