import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { path: '/debt-gdp', icon: '📊', label: 'Debt / GDP' },
  { path: '/gdp', icon: '💰', label: 'GDP' },
  { path: '/debt', icon: '💳', label: 'Debt' },
  { path: '/m2', icon: '🏦', label: 'M2' },
  { path: '/trade', icon: '⚖️', label: 'Trade Balance' },
  { path: '/employment', icon: '👷', label: 'Employment' },
  { path: '/bonds', icon: '📈', label: 'Bond Yields' },
  { path: '/corporate-bonds', icon: '🏢', label: 'Corporate Bonds' },
];

export default function Layout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-[#ebd9b0] dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-[#bfb9ac] dark:bg-gray-900 border-r border-stone-400 dark:border-gray-800 flex flex-col min-h-screen fixed">
        <div className="p-4 border-b border-stone-400 dark:border-gray-800 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-yellow-500">
            Borosa Graphs
          </NavLink>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-4 text-xs text-gray-500 uppercase tracking-wider mb-2">Metrics</p>

          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-all ${
                  isActive ? 'active bg-black/10 dark:bg-white/10 border-l-[3px] border-yellow-500' : ''
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-400 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400">
          <p className="mb-2">Weekly automated updates</p>
          <div className="flex flex-col gap-1">
            <a href="https://www.imf.org/external/datamapper" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-200">IMF DataMapper</a>
            <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-200">World Bank</a>
            <a href="https://www.investing.com/rates-bonds/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-200">Investing.com</a>
            <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-800 dark:hover:text-gray-200">FRED</a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 bg-[#ebd9b0] dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
