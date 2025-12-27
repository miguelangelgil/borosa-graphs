import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { useChartData } from '../hooks/useChartData';
import { regionColors, lineColors, getThemeColors } from '../utils/chartUtils';
import { ViewToggle, Select, LineControls, CountrySelector, Legend } from '../components/ChartControls';
import InfoTooltip from '../components/InfoTooltip';

Chart.register(...registerables);

function formatNumber(num, decimals = 2) {
  return num.toFixed(decimals);
}

export default function Bonds() {
  const { isDark } = useTheme();
  const { data, loading, error } = useChartData('./data/bonds_data.json');

  const [view, setView] = useState('bar');
  const [currentDuration, setCurrentDuration] = useState('10Y');
  const [currentRegion, setCurrentRegion] = useState('all');
  const [currentSort, setCurrentSort] = useState('value');
  const [selectedCountries, setSelectedCountries] = useState(new Set(['USA', 'CHN', 'JPN', 'DEU', 'ESP', 'FRA', 'GBR', 'ITA']));
  const [lineRegionFilter, setLineRegionFilter] = useState('all');

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Get unique regions from data
  const regions = useMemo(() => {
    if (!data?.data) return [];
    const allRegions = new Set();
    Object.values(data.data).forEach(items => {
      items.forEach(item => allRegions.add(item.region));
    });
    return Array.from(allRegions).sort();
  }, [data]);

  // Filter and sort bar data
  const barData = useMemo(() => {
    if (!data?.data?.[currentDuration]) return [];
    let items = data.data[currentDuration];

    if (currentRegion !== 'all') {
      items = items.filter(d => d.region === currentRegion);
    }

    if (currentSort === 'value') {
      items = [...items].sort((a, b) => b.value - a.value);
    } else {
      items = [...items].sort((a, b) => a.country.localeCompare(b.country));
    }

    return items;
  }, [data, currentDuration, currentRegion, currentSort]);

  // Get countries for line chart selector
  const countries = useMemo(() => {
    if (!data?.timeseries) return [];
    let list = Object.entries(data.timeseries)
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => a.country.localeCompare(b.country));

    if (lineRegionFilter !== 'all') {
      list = list.filter(c => c.region === lineRegionFilter);
    }

    return list;
  }, [data, lineRegionFilter]);

  const toggleCountry = (code) => {
    const newSet = new Set(selectedCountries);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedCountries(newSet);
  };

  const handleViewChange = useCallback((newView) => {
    if (newView === 'line' && barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }
    if (newView === 'bar' && lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }
    setView(newView);
  }, []);

  // Bar chart effect
  useEffect(() => {
    if (view !== 'bar' || !barChartRef.current || barData.length === 0) return;

    const colors = getThemeColors(isDark);

    const chartData = {
      labels: barData.map(d => d.country),
      datasets: [{
        label: 'Yield',
        data: barData.map(d => d.value),
        backgroundColor: barData.map(d => regionColors[d.region] || '#888'),
        borderRadius: 4,
        barThickness: 18
      }]
    };

    const options = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.labelColor,
          bodyColor: colors.tickColor,
          callbacks: {
            label: (ctx) => {
              const d = barData[ctx.dataIndex];
              return [`Yield: ${formatNumber(d.value)}%`, `Region: ${d.region}`];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor, callback: v => formatNumber(v) + '%' }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 11 } }
        }
      }
    };

    // Always destroy and recreate to ensure animation plays
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }

    barChartInstance.current = new Chart(barChartRef.current, {
      type: 'bar',
      data: chartData,
      options
    });
  }, [view, barData, isDark]);

  // Line chart effect - shows yield curve (durations)
  useEffect(() => {
    if (view !== 'line' || !lineChartRef.current || !data?.timeseries) return;

    const colors = getThemeColors(isDark);
    const durations = data.metadata?.available_durations || [];

    const datasets = [];
    let colorIndex = 0;

    selectedCountries.forEach(code => {
      const countryData = data.timeseries[code];
      if (!countryData) return;

      const color = lineColors[colorIndex % lineColors.length];
      colorIndex++;

      const yieldData = durations.map(d => countryData.yields[d] || null);

      datasets.push({
        label: countryData.country,
        data: yieldData,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        spanGaps: true
      });
    });

    const chartData = {
      labels: durations,
      datasets
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: colors.labelColor,
            font: { size: 10 }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.labelColor,
          bodyColor: colors.tickColor,
          callbacks: {
            title: (ctx) => `Duration: ${ctx[0].label}`,
            label: (ctx) => {
              if (ctx.raw === null) return null;
              return `${ctx.dataset.label}: ${formatNumber(ctx.raw)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Bond Duration',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Yield (%)',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor, callback: v => formatNumber(v) + '%' }
        }
      }
    };

    // Always destroy and recreate to ensure animation plays
    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }

    lineChartInstance.current = new Chart(lineChartRef.current, {
      type: 'line',
      data: chartData,
      options
    });
  }, [view, selectedCountries, data, isDark]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">📈 Government Bond Yields</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">📈 Government Bond Yields</h1>
        <p className="text-red-400 text-sm mb-2">Error: {error}</p>
        <p className="text-gray-500 text-sm">Run the GitHub Action to generate data.</p>
      </div>
    );
  }

  const avg = barData.length > 0 ? barData.reduce((sum, d) => sum + d.value, 0) / barData.length : 0;
  const durations = data?.metadata?.available_durations || [];

  const durationOptions = durations.map(d => ({ value: d, label: d }));
  const regionOptions = [
    { value: 'all', label: 'All' },
    ...regions.map(r => ({ value: r, label: r }))
  ];
  const sortOptions = [
    { value: 'value', label: 'Value' },
    { value: 'name', label: 'Alphabetical' }
  ];

  const infoBar = `Shows current government bond yields for the selected duration (${currentDuration}). Higher yields indicate higher borrowing costs or perceived risk.`;
  const infoLine = "Shows the yield curve for selected countries - how yields vary across different bond durations (from short-term to long-term).";

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">
          {view === 'bar' ? `📈 Government Bond Yields - ${currentDuration}` : '📈 Bond Yields by Duration'}
        </h1>
        <InfoTooltip text={view === 'bar' ? infoBar : infoLine} />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {view === 'bar'
          ? `${barData.length} countries · Average: ${formatNumber(avg)}% · Updated: ${data?.metadata?.fetched_at?.split('T')[0] || 'N/A'}`
          : `${selectedCountries.size} countries selected · Updated: ${data?.metadata?.fetched_at?.split('T')[0] || 'N/A'}`
        }
      </p>

      <ViewToggle view={view} setView={handleViewChange} />

      {view === 'bar' ? (
        <>
          <div className="flex gap-4 mb-4 flex-wrap">
            <Select label="Duration" value={currentDuration} onChange={setCurrentDuration} options={durationOptions} />
            <Select label="Region" value={currentRegion} onChange={setCurrentRegion} options={regionOptions} />
            <Select label="Sort" value={currentSort} onChange={setCurrentSort} options={sortOptions} />
          </div>
          <Legend regions={regions} regionColors={regionColors} />
          <div style={{ height: Math.max(400, barData.length * 24 + 50) + 'px' }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </>
      ) : (
        <>
          <LineControls
            regions={regions}
            lineRegionFilter={lineRegionFilter}
            setLineRegionFilter={setLineRegionFilter}
            onClearSelection={() => setSelectedCountries(new Set())}
          />
          <CountrySelector
            countries={countries}
            selectedCountries={selectedCountries}
            toggleCountry={toggleCountry}
          />
          <div style={{ height: '500px' }}>
            <canvas ref={lineChartRef}></canvas>
          </div>
        </>
      )}
    </div>
  );
}
