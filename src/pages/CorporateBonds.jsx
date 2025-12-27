import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { useChartData } from '../hooks/useChartData';
import { getThemeColors } from '../utils/chartUtils';
import { ViewToggle, Select, LineControls } from '../components/ChartControls';
import InfoTooltip from '../components/InfoTooltip';

Chart.register(...registerables);

// Base colors by region
const regionColors = {
  "North America": "#3b82f6",
  "Europe": "#8b5cf6",
  "Asia": "#f59e0b",
  "Latin America": "#10b981",
  "Emerging Markets": "#ec4899",
  "EMEA": "#06b6d4"
};

// Color shades by region and category
const regionCategoryColors = {
  "North America": {
    "Investment Grade": "#60a5fa",
    "High Yield": "#1d4ed8",
    "Spreads": "#3b82f6"
  },
  "Europe": {
    "Investment Grade": "#a78bfa",
    "High Yield": "#6d28d9",
    "Spreads": "#8b5cf6"
  },
  "Asia": {
    "Investment Grade": "#fbbf24",
    "High Yield": "#b45309",
    "Spreads": "#f59e0b"
  },
  "Latin America": {
    "Investment Grade": "#34d399",
    "High Yield": "#047857",
    "Spreads": "#10b981"
  },
  "Emerging Markets": {
    "Investment Grade": "#f472b6",
    "High Yield": "#be185d",
    "Spreads": "#ec4899"
  },
  "EMEA": {
    "Investment Grade": "#22d3ee",
    "High Yield": "#0e7490",
    "Spreads": "#06b6d4"
  }
};

function getColor(region, category) {
  if (regionCategoryColors[region]?.[category]) {
    return regionCategoryColors[region][category];
  }
  return regionColors[region] || '#888';
}

function formatNumber(num, decimals = 2) {
  return num.toFixed(decimals);
}

export default function CorporateBonds() {
  const { isDark } = useTheme();
  const { data, loading, error } = useChartData('./data/corporate_bonds_data.json');

  const [view, setView] = useState('bar');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentRegion, setCurrentRegion] = useState('all');
  const [selectedSeries, setSelectedSeries] = useState(new Set(['US_IG', 'US_HY', 'EU_HY', 'EM_TOTAL', 'ASIA_EM', 'LATAM_EM']));
  const [lineRegionFilter, setLineRegionFilter] = useState('all');

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Get unique regions from data
  const regions = useMemo(() => {
    return data?.metadata?.regions || [];
  }, [data]);

  // Filter bar data
  const barData = useMemo(() => {
    if (!data?.current) return [];
    let items = [];

    for (const [category, bonds] of Object.entries(data.current)) {
      // Exclude Spreads from "All Categories" (different units)
      if (currentCategory === "all" && category === "Spreads") {
        continue;
      }
      if (currentCategory === "all" || currentCategory === category) {
        for (const bond of bonds) {
          if (currentRegion !== "all" && bond.region !== currentRegion) {
            continue;
          }
          items.push({ ...bond, category });
        }
      }
    }

    return items.sort((a, b) => b.value - a.value);
  }, [data, currentCategory, currentRegion]);

  // Get series for line chart selector
  const allSeries = useMemo(() => {
    if (!data?.timeseries) return [];
    let list = Object.entries(data.timeseries)
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => {
        if (a.region !== b.region) return a.region.localeCompare(b.region);
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.name.localeCompare(b.name);
      });

    if (lineRegionFilter !== 'all') {
      list = list.filter(s => s.region === lineRegionFilter);
    }

    return list;
  }, [data, lineRegionFilter]);

  const toggleSeries = (code) => {
    const newSet = new Set(selectedSeries);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setSelectedSeries(newSet);
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
    const isSpreads = currentCategory === "Spreads";
    const unit = isSpreads ? " bps" : "%";

    const chartData = {
      labels: barData.map(d => d.name),
      datasets: [{
        label: 'Yield',
        data: barData.map(d => d.value),
        backgroundColor: barData.map(d => getColor(d.region, d.category)),
        borderRadius: 4,
        barThickness: 28
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
              const valueLabel = d.category === "Spreads" ? "Spread" : "Yield";
              const valueUnit = d.category === "Spreads" ? " bps" : "%";
              return [`${valueLabel}: ${formatNumber(d.value)}${valueUnit}`, `Region: ${d.region}`, `Category: ${d.category}`, d.description];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor, callback: v => formatNumber(v) + unit }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 12 } }
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
  }, [view, barData, isDark, currentCategory]);

  // Line chart effect
  useEffect(() => {
    if (view !== 'line' || !lineChartRef.current || !data?.timeseries) return;

    const colors = getThemeColors(isDark);

    // Get all unique dates
    const allDates = new Set();
    selectedSeries.forEach(code => {
      const series = data.timeseries[code];
      if (series) {
        series.data.forEach(d => allDates.add(d.date));
      }
    });
    const sortedDates = Array.from(allDates).sort();

    const datasets = [];

    selectedSeries.forEach(code => {
      const series = data.timeseries[code];
      if (!series) return;

      const color = getColor(series.region, series.category);

      // Create data array aligned with dates
      const dateMap = {};
      series.data.forEach(d => { dateMap[d.date] = d.value; });

      const yieldData = sortedDates.map(date => dateMap[date] || null);

      datasets.push({
        label: `${series.name} (${series.region})`,
        data: yieldData,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        spanGaps: true
      });
    });

    const chartData = {
      labels: sortedDates.map(d => d.substring(0, 7)),
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
            label: (ctx) => {
              if (ctx.raw === null) return null;
              return `${ctx.dataset.label}: ${formatNumber(ctx.raw)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            maxTicksLimit: 15,
            callback: function(value) {
              const label = this.getLabelForValue(value);
              if (label && label.endsWith('-01')) {
                return label.substring(0, 4);
              }
              return '';
            }
          }
        },
        y: {
          beginAtZero: false,
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
  }, [view, selectedSeries, data, isDark]);

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
        <h1 className="text-2xl font-bold mb-1">🏢 Corporate Bond Yields</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">🏢 Corporate Bond Yields</h1>
        <p className="text-red-400 text-sm mb-2">Error: {error}</p>
        <p className="text-gray-500 text-sm">Run the GitHub Action to generate data.</p>
      </div>
    );
  }

  const avg = barData.length > 0 ? barData.reduce((sum, d) => sum + d.value, 0) / barData.length : 0;
  const isSpreads = currentCategory === "Spreads";
  const unit = isSpreads ? " bps" : "%";
  const titleSuffix = isSpreads ? " - Spreads (vs Treasury)" : "";

  const categories = ["all", ...(data?.metadata?.categories || [])];
  const categoryOptions = categories.map(c => ({
    value: c,
    label: c === "all" ? "All Categories" : c
  }));
  const regionOptions = [
    { value: 'all', label: 'All Regions' },
    ...regions.map(r => ({ value: r, label: r }))
  ];

  const unselectedClasses = isDark
    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
    : 'bg-[#d9d3c7] text-gray-700 hover:bg-[#cec8bc]';

  const infoBar = "Shows current corporate bond yields by region and category. Investment Grade (IG) bonds are lower risk, High Yield (HY) bonds offer higher returns with more risk.";
  const infoLine = "Shows how corporate bond yields have evolved over time for selected indices across different regions and credit categories.";

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-1">
        <InfoTooltip text={view === 'bar' ? infoBar : infoLine} />
        <h1 className="text-2xl font-bold">
          {view === 'bar' ? `🏢 Corporate Bond Yields${titleSuffix}` : '📈 Corporate Bond Yields - Historical'}
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {view === 'bar'
          ? `${barData.length} indices · Average: ${formatNumber(avg)}${unit} · Updated: ${data?.metadata?.fetched_at?.split('T')[0] || 'N/A'}`
          : `${selectedSeries.size} series selected · Updated: ${data?.metadata?.fetched_at?.split('T')[0] || 'N/A'}`
        }
      </p>

      <ViewToggle view={view} setView={handleViewChange} />

      {view === 'bar' ? (
        <>
          <div className="flex gap-4 mb-4 flex-wrap">
            <Select label="Category" value={currentCategory} onChange={setCurrentCategory} options={categoryOptions} />
            <Select label="Region" value={currentRegion} onChange={setCurrentRegion} options={regionOptions} />
          </div>

          {/* Legend with gradient colors */}
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            {Object.entries(regionColors).map(([region]) => {
              const igColor = regionCategoryColors[region]["Investment Grade"];
              const hyColor = regionCategoryColors[region]["High Yield"];
              return (
                <span key={region} className="flex items-center gap-1 mr-3">
                  <span className="w-3 h-3 rounded" style={{ background: `linear-gradient(to right, ${igColor}, ${hyColor})` }}></span>
                  {region}
                </span>
              );
            })}
            <span className="text-gray-500 ml-2">|</span>
            <span className="text-gray-500 ml-2">Lighter = IG</span>
            <span className="text-gray-500">Darker = HY</span>
          </div>

          <div style={{ height: Math.max(300, barData.length * 45 + 50) + 'px' }}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </>
      ) : (
        <>
          <LineControls
            regions={regions}
            lineRegionFilter={lineRegionFilter}
            setLineRegionFilter={setLineRegionFilter}
            onClearSelection={() => setSelectedSeries(new Set())}
          />

          {/* Series selector */}
          <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto p-2 bg-[#e8e2d6] dark:bg-gray-800 rounded">
            {allSeries.map(s => {
              const isSelected = selectedSeries.has(s.code);
              const seriesColor = getColor(s.region, s.category);
              return (
                <span
                  key={s.code}
                  onClick={() => toggleSeries(s.code)}
                  className={`px-2 py-1 rounded text-xs cursor-pointer transition-all font-medium ${isSelected ? 'text-white hover:opacity-80' : unselectedClasses}`}
                  style={isSelected ? { backgroundColor: seriesColor } : {}}
                  title={`${s.region} · ${s.category} · ${s.description}`}
                >
                  {s.name}
                </span>
              );
            })}
          </div>

          <div style={{ height: '500px' }}>
            <canvas ref={lineChartRef}></canvas>
          </div>
        </>
      )}
    </div>
  );
}
