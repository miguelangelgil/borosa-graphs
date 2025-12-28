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
  { path: '/recession-indicators', icon: '🚨', label: 'Recession Indicators' },
];

export default function Layout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-[#f5f0e8] dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-[#e8e2d6] dark:bg-gray-900 border-r border-[#c4bfb3] dark:border-gray-800 flex flex-col h-screen fixed top-0 left-0 z-10">
        <div className="p-4 border-b border-[#c4bfb3] dark:border-gray-800 flex items-center justify-between">
          <NavLink to="/" className="text-xl font-bold text-amber-700 dark:text-yellow-500">
            Borosa Graphs
          </NavLink>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/60 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? '🌙' : '☀️'}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <p className="px-4 text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Metrics</p>

          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
              `sidebar-link flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'active'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-[#d9d3c7] dark:hover:bg-gray-800'
              }`
            }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#c4bfb3] dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <p className="mb-2 font-medium">Weekly automated updates</p>
          <div className="flex flex-col gap-1">
            <a href="https://www.imf.org/external/datamapper" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">IMF DataMapper</a>
            <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">World Bank</a>
            <a href="https://www.investing.com/rates-bonds/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">Investing.com</a>
            <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">FRED</a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 bg-[#f5f0e8] dark:bg-gray-950 text-gray-800 dark:text-white min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
