import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavigationProvider } from './contexts/NavigationContext';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <NavigationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Layout />} />
        </Routes>
      </BrowserRouter>
    </NavigationProvider>
  );
}

export default App;
