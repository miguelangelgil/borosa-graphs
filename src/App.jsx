import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import DebtGdp from './pages/DebtGdp';
import Gdp from './pages/Gdp';
import Debt from './pages/Debt';
import M2 from './pages/M2';
import Trade from './pages/Trade';
import Employment from './pages/Employment';
import Bonds from './pages/Bonds';
import CorporateBonds from './pages/CorporateBonds';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="debt-gdp" element={<DebtGdp />} />
          <Route path="gdp" element={<Gdp />} />
          <Route path="debt" element={<Debt />} />
          <Route path="m2" element={<M2 />} />
          <Route path="trade" element={<Trade />} />
          <Route path="employment" element={<Employment />} />
          <Route path="bonds" element={<Bonds />} />
          <Route path="corporate-bonds" element={<CorporateBonds />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
