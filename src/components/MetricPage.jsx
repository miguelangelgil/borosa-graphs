import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { useChartData } from '../hooks/useChartData';
import {
  regionColors,
  lineColors,
  getThemeColors,
  formatNumber
} from '../utils/chartUtils';
import {
  ViewToggle,
  BarControls,
  LineControls,
  CountrySelector,
  Legend
} from './ChartControls';

Chart.register(...registerables);

export default function MetricPage({
  dataFile,
  valueKey,
  valueLabel,
  valueUnit,
  titleBar,
  titleLine,
  refLines = [],
  formatFn = formatNumber
}) {
  const { isDark } = useTheme();
  const { data, loading, error } = useChartData(dataFile);

  const [view, setView] = useState('bar');
  const [currentYear, setCurrentYear] = useState('2024');
  const [currentRegion, setCurrentRegion] = useState('all');
  const [currentSort, setCurrentSort] = useState('value');
  const [selectedCountries, setSelectedCountries] = useState(new Set(['USA', 'CHN', 'JPN', 'DEU', 'ESP', 'FRA', 'GBR', 'ITA']));
  const [lineRegionFilter, setLineRegionFilter] = useState('all');

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);

  // Initialize year when data loads
  useEffect(() => {
    if (data?.metadata?.last_real_year) {
      setCurrentYear(data.metadata.last_real_year);
    }
  }, [data]);

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
    if (!data?.data?.[currentYear]) return [];
    let items = data.data[currentYear];

    if (currentRegion !== 'all') {
      items = items.filter(d => d.region === currentRegion);
    }

    if (currentSort === 'value') {
      items = [...items].sort((a, b) => b[valueKey] - a[valueKey]);
    } else {
      items = [...items].sort((a, b) => a.country.localeCompare(b.country));
    }

    return items;
  }, [data, currentYear, currentRegion, currentSort, valueKey]);

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

  // Toggle country selection
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
    const isProjectionYear = data?.metadata?.projection_years?.includes(currentYear);

    const chartData = {
      labels: barData.map(d => d.country),
      datasets: [{
        label: valueLabel,
        data: barData.map(d => d[valueKey]),
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
              return [`${valueLabel}: ${formatFn(d[valueKey])}${valueUnit}`, `Region: ${d.region}`];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor, callback: v => formatFn(v) + valueUnit }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 11 } }
        }
      }
    };

    // Add reference lines plugin if needed
    const plugins = refLines.length > 0 ? [{
      id: 'refLines',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        ctx.save();
        ctx.setLineDash([5, 5]);

        refLines.forEach(line => {
          const x = xAxis.getPixelForValue(line.value);
          ctx.strokeStyle = line.color;
          ctx.beginPath();
          ctx.moveTo(x, yAxis.top);
          ctx.lineTo(x, yAxis.bottom);
          ctx.stroke();
        });

        ctx.restore();
      }
    }] : [];

    if (barChartInstance.current) {
      barChartInstance.current.data = chartData;
      barChartInstance.current.options.scales.x.grid.color = colors.gridColor;
      barChartInstance.current.options.scales.x.ticks.color = colors.tickColor;
      barChartInstance.current.options.scales.y.ticks.color = colors.labelColor;
      barChartInstance.current.update('none');
    } else {
      barChartInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: chartData,
        options,
        plugins
      });
    }

    return () => {
      if (barChartInstance.current && view !== 'bar') {
        barChartInstance.current.destroy();
        barChartInstance.current = null;
      }
    };
  }, [view, barData, isDark, valueKey, valueLabel, valueUnit, formatFn, refLines, currentYear, data]);

  // Line chart effect
  useEffect(() => {
    if (view !== 'line' || !lineChartRef.current || !data?.timeseries) return;

    const colors = getThemeColors(isDark);
    const projectionYears = new Set(data.metadata?.projection_years || []);

    const allYears = [...new Set(
      Object.values(data.timeseries)
        .flatMap(c => c.data.map(d => d.year))
    )].sort();

    const datasets = [];
    let colorIndex = 0;

    selectedCountries.forEach(code => {
      const countryData = data.timeseries[code];
      if (!countryData) return;

      const color = lineColors[colorIndex % lineColors.length];
      colorIndex++;

      const realData = [];
      const projectionData = [];

      allYears.forEach(year => {
        const point = countryData.data.find(d => d.year === year);
        const value = point ? point[valueKey] : null;

        if (projectionYears.has(year)) {
          projectionData.push(value);
          realData.push(null);
        } else {
          realData.push(value);
          projectionData.push(null);
        }
      });

      datasets.push({
        label: countryData.country,
        data: realData,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
        spanGaps: true
      });

      if (projectionData.some(v => v !== null)) {
        datasets.push({
          label: `${countryData.country} (proj.)`,
          data: projectionData,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 2,
          tension: 0.1,
          spanGaps: true
        });
      }
    });

    const chartData = {
      labels: allYears,
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
            font: { size: 10 },
            filter: (item) => !item.text.includes('(proj.)')
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
              const isProj = ctx.dataset.label.includes('(proj.)');
              const name = ctx.dataset.label.replace(' (proj.)', '');
              return `${name}: ${formatFn(ctx.raw)}${valueUnit}${isProj ? ' (projection)' : ''}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor }
        },
        y: {
          beginAtZero: true,
          grid: { color: colors.gridColor },
          ticks: { color: colors.tickColor, callback: v => formatFn(v) + valueUnit }
        }
      }
    };

    // Add reference lines plugin for line chart
    const plugins = refLines.length > 0 ? [{
      id: 'refLinesLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const yAxis = chart.scales.y;
        const xAxis = chart.scales.x;

        ctx.save();
        ctx.setLineDash([5, 5]);

        refLines.forEach(line => {
          const y = yAxis.getPixelForValue(line.value);
          ctx.strokeStyle = line.color;
          ctx.beginPath();
          ctx.moveTo(xAxis.left, y);
          ctx.lineTo(xAxis.right, y);
          ctx.stroke();
        });

        ctx.restore();
      }
    }] : [];

    if (lineChartInstance.current) {
      lineChartInstance.current.data = chartData;
      lineChartInstance.current.options.scales.x.grid.color = colors.gridColor;
      lineChartInstance.current.options.scales.x.ticks.color = colors.tickColor;
      lineChartInstance.current.options.scales.y.grid.color = colors.gridColor;
      lineChartInstance.current.options.scales.y.ticks.color = colors.tickColor;
      lineChartInstance.current.update('none');
    } else {
      lineChartInstance.current = new Chart(lineChartRef.current, {
        type: 'line',
        data: chartData,
        options,
        plugins
      });
    }

    return () => {
      if (lineChartInstance.current && view !== 'line') {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
    };
  }, [view, selectedCountries, data, isDark, valueKey, valueUnit, formatFn, refLines]);

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
        <h1 className="text-2xl font-bold mb-1">{titleBar}</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">{titleBar}</h1>
        <p className="text-red-400 text-sm mb-2">Error: {error}</p>
        <p className="text-gray-500 text-sm">Run the GitHub Action to generate data.</p>
      </div>
    );
  }

  const isProjectionYear = data?.metadata?.projection_years?.includes(currentYear);
  const avg = barData.length > 0 ? barData.reduce((sum, d) => sum + d[valueKey], 0) / barData.length : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">
        {view === 'bar' ? `${titleBar} (${currentYear})${isProjectionYear ? ' - Projection' : ''}` : titleLine}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {view === 'bar'
          ? `${barData.length} countries · Average: ${formatFn(avg)}${valueUnit} · Updated: ${data?.metadata?.fetched_at?.split('T')[0] || 'N/A'}`
          : `${selectedCountries.size} countries selected · Updated: ${data?.metadata?.fetched_at?.split('T')[0] || 'N/A'}`
        }
      </p>

      <ViewToggle view={view} setView={handleViewChange} />

      {view === 'bar' ? (
        <>
          <BarControls
            years={data?.metadata?.available_years || []}
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
            regions={regions}
            currentRegion={currentRegion}
            setCurrentRegion={setCurrentRegion}
            currentSort={currentSort}
            setCurrentSort={setCurrentSort}
            projectionYears={data?.metadata?.projection_years || []}
          />
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
