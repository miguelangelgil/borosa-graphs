import { useTheme } from '../hooks/useTheme';

export function ViewToggle({ view, setView }) {
  const { isDark } = useTheme();

  const activeClass = 'bg-yellow-500 text-black';
  const inactiveClass = isDark
    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    : 'bg-stone-400 text-gray-900 hover:bg-stone-500';

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setView('bar')}
        className={`px-4 py-2 rounded text-sm font-medium ${view === 'bar' ? activeClass : inactiveClass}`}
      >
        📊 Country Ranking
      </button>
      <button
        onClick={() => setView('line')}
        className={`px-4 py-2 rounded text-sm font-medium ${view === 'line' ? activeClass : inactiveClass}`}
      >
        📈 Time Evolution
      </button>
    </div>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-gray-600 dark:text-gray-400 mr-2">{label}:</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function BarControls({ years, currentYear, setCurrentYear, regions, currentRegion, setCurrentRegion, currentSort, setCurrentSort, projectionYears = [] }) {
  const yearOptions = years.map(y => ({
    value: y,
    label: projectionYears.includes(y) ? `${y} (proj.)` : y
  }));

  const regionOptions = [
    { value: 'all', label: 'All' },
    ...regions.filter(r => r !== 'all').map(r => ({ value: r, label: r }))
  ];

  const sortOptions = [
    { value: 'value', label: 'Value' },
    { value: 'name', label: 'Alphabetical' }
  ];

  return (
    <div className="flex gap-4 mb-4 flex-wrap">
      <Select label="Year" value={currentYear} onChange={setCurrentYear} options={yearOptions} />
      <Select label="Region" value={currentRegion} onChange={setCurrentRegion} options={regionOptions} />
      <Select label="Sort" value={currentSort} onChange={setCurrentSort} options={sortOptions} />
    </div>
  );
}

export function LineControls({ regions, lineRegionFilter, setLineRegionFilter, onClearSelection }) {
  const { isDark } = useTheme();

  const regionOptions = [
    { value: 'all', label: 'All regions' },
    ...regions.filter(r => r !== 'all').map(r => ({ value: r, label: r }))
  ];

  return (
    <div className="flex gap-4 mb-4 flex-wrap items-center">
      <Select label="Filter by region" value={lineRegionFilter} onChange={setLineRegionFilter} options={regionOptions} />
      <button
        onClick={onClearSelection}
        className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-stone-400 text-gray-900 hover:bg-stone-500'}`}
      >
        Clear selection
      </button>
    </div>
  );
}

export function CountrySelector({ countries, selectedCountries, toggleCountry }) {
  const { isDark } = useTheme();

  const unselectedClasses = isDark
    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
    : 'bg-stone-400 text-gray-900 hover:bg-stone-500';

  return (
    <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
      {countries.map(c => (
        <span
          key={c.code}
          onClick={() => toggleCountry(c.code)}
          className={`px-2 py-1 rounded text-xs cursor-pointer transition-all font-medium ${
            selectedCountries.has(c.code)
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : unselectedClasses
          }`}
        >
          {c.country}
        </span>
      ))}
    </div>
  );
}

export function Legend({ regions, regionColors }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm mb-4">
      {Object.entries(regionColors).map(([region, color]) => (
        <span key={region} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: color }}></span>
          {region}
        </span>
      ))}
    </div>
  );
}
