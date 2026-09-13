import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './AppContext';
import AdminView from './mechanisms/liquidDemocracy/AdminView';
import ResultsView from './mechanisms/liquidDemocracy/ResultsView';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh' }}>
          <nav style={{
            background: '#2c3e50',
            padding: '1rem 2rem',
            color: 'white',
            marginBottom: '2rem'
          }}>
            <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '1.5rem' }}>
              決定の多様性を体験するアプリ
            </h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>
                管理画面
              </Link>
              <Link to="/results" style={{ color: 'white', textDecoration: 'none' }}>
                結果画面
              </Link>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<AdminView />} />
            <Route path="/admin" element={<AdminView />} />
            <Route path="/results" element={<ResultsView />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
