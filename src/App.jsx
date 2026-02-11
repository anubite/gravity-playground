import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LibraryProvider } from './context/LibraryContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Patrons from './pages/Patrons';
import Loans from './pages/Loans';

function App() {
  return (
    <LibraryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="patrons" element={<Patrons />} />
            <Route path="loans" element={<Loans />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LibraryProvider>
  );
}

export default App;
