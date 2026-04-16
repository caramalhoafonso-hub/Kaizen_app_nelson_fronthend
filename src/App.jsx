import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MateriaPrima from './pages/MateriaPrima.jsx';
import Scanner from './pages/Scanner.jsx';
import Movimentacoes from './pages/Movimentacoes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Navbar />
        <div className="main">
          <Routes>
            <Route path="/"              element={<Dashboard />}    />
            <Route path="/materia-prima" element={<MateriaPrima />} />
            <Route path="/scanner"       element={<Scanner />}      />
            <Route path="/movimentacoes" element={<Movimentacoes />}/>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
