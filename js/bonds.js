// Government Bond Yields module
// Custom module with duration selector instead of year selector

const bondsModule = (function() {
  const prefix = 'bonds';
  const dataFile = './data/bonds_data.json';
  const valueLabel = 'Yield';
  const valueUnit = '%';
  const titleBar = '📈 Government Bond Yields';
  const titleLine = '📈 Bond Yields by Duration';

  let data = null;
  let barChart = null;
  let lineChart = null;
  let currentDuration = "10Y";
  let currentRegion = "all";
  let currentSort = "value";
  let currentView = "bar";
  let selectedCountries = new Set(['USA', 'CHN', 'JPN', 'DEU', 'ESP', 'FRA', 'GBR', 'ITA']);
  let lineRegionFilter = "all";

  const regionColors = {
    "Asia": "#f59e0b",
    "Europe": "#3b82f6",
    "Americas": "#10b981",
    "Latam": "#8b5cf6",
    "MENA": "#ef4444",
    "Africa": "#6b7280",
    "Oceania": "#06b6d4"
  };

  const lineColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#78716c', '#64748b', '#ffffff'
  ];

  function getThemeColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      gridColor: isDark ? '#1f2937' : '#9ca3af',
      tickColor: isDark ? '#9ca3af' : '#374151',
      labelColor: isDark ? '#e5e7eb' : '#111827',
      tooltipBg: isDark ? '#111827' : '#f5f5f0',
      tooltipBorder: isDark ? '#374151' : '#9ca3af'
    };
  }

  function formatNumber(num, decimals = 2) {
    return num.toFixed(decimals);
  }

  function renderLegend() {
    const legend = document.getElementById(`${prefix}-legend`);
    if (currentView === 'bar') {
      legend.innerHTML = Object.entries(regionColors).map(([region, color]) =>
        `<span class="flex items-center gap-1">
          <span class="w-3 h-3 rounded" style="background-color: ${color}"></span>
          ${region}
        </span>`
      ).join('');
    } else {
      legend.innerHTML = '';
    }
  }

  function getFilteredBarData() {
    let items = data.data[currentDuration] || [];

    if (currentRegion !== "all") {
      items = items.filter(d => d.region === currentRegion);
    }

    if (currentSort === "value") {
      items = [...items].sort((a, b) => b.value - a.value);
    } else {
      items = [...items].sort((a, b) => a.country.localeCompare(b.country));
    }

    return items;
  }

  function updateBarChart() {
    const items = getFilteredBarData();
    const colors = getThemeColors();

    const containerHeight = Math.max(400, items.length * 24 + 50);
    document.getElementById(`${prefix}-barChartContainer`).style.height = containerHeight + 'px';

    const total = items.reduce((sum, d) => sum + d.value, 0);
    const avg = items.length > 0 ? total / items.length : 0;

    document.getElementById(`${prefix}-title`).textContent = `${titleBar} - ${currentDuration}`;
    document.getElementById(`${prefix}-subtitle`).textContent =
      `${items.length} countries · Average: ${formatNumber(avg)}${valueUnit} · Updated: ${data.metadata?.fetched_at?.split('T')[0] || 'N/A'}`;

    const chartData = {
      labels: items.map(d => d.country),
      datasets: [{
        label: valueLabel,
        data: items.map(d => d.value),
        backgroundColor: items.map(d => regionColors[d.region] || '#888'),
        borderRadius: 4,
        barThickness: 18
      }]
    };

    if (barChart) {
      barChart.data = chartData;
      barChart.options.scales.x.grid.color = colors.gridColor;
      barChart.options.scales.x.ticks.color = colors.tickColor;
      barChart.options.scales.y.ticks.color = colors.labelColor;
      barChart.update('none');
    } else {
      const ctx = document.getElementById(`${prefix}-barChart`).getContext('2d');
      barChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
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
                  const d = items[ctx.dataIndex];
                  return [`${valueLabel}: ${formatNumber(d.value)}${valueUnit}`, `Region: ${d.region}`];
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: colors.gridColor },
              ticks: { color: colors.tickColor, callback: v => formatNumber(v) + valueUnit }
            },
            y: {
              grid: { display: false },
              ticks: { color: colors.labelColor, font: { size: 11 } }
            }
          }
        }
      });
    }
  }

  function renderCountrySelector() {
    const container = document.getElementById(`${prefix}-countrySelector`);
    let countries = Object.entries(data.timeseries)
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => a.country.localeCompare(b.country));

    if (lineRegionFilter !== "all") {
      countries = countries.filter(c => c.region === lineRegionFilter);
    }

    const isDark = document.documentElement.classList.contains('dark');

    container.innerHTML = countries.map(c => {
      const isSelected = selectedCountries.has(c.code);
      const unselectedClasses = isDark
        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
        : 'bg-stone-400 text-gray-900 hover:bg-stone-500';
      return `<span
        class="country-chip px-2 py-1 rounded text-xs cursor-pointer transition-all font-medium ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : unselectedClasses}"
        data-code="${c.code}"
      >${c.country}</span>`;
    }).join('');

    container.querySelectorAll('.country-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const code = chip.dataset.code;
        if (selectedCountries.has(code)) {
          selectedCountries.delete(code);
        } else {
          selectedCountries.add(code);
        }
        renderCountrySelector();
        updateLineChart();
      });
    });
  }

  function updateLineChart() {
    const colors = getThemeColors();
    const durations = data.metadata.available_durations || [];

    document.getElementById(`${prefix}-title`).textContent = titleLine;
    document.getElementById(`${prefix}-subtitle`).textContent =
      `${selectedCountries.size} countries selected · Updated: ${data.metadata?.fetched_at?.split('T')[0] || 'N/A'}`;

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
      datasets: datasets
    };

    if (lineChart) {
      lineChart.data = chartData;
      lineChart.options.scales.x.grid.color = colors.gridColor;
      lineChart.options.scales.x.ticks.color = colors.tickColor;
      lineChart.options.scales.y.grid.color = colors.gridColor;
      lineChart.options.scales.y.ticks.color = colors.tickColor;
      lineChart.update('none');
    } else {
      const ctx = document.getElementById(`${prefix}-lineChart`).getContext('2d');
      lineChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
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
                  return `${ctx.dataset.label}: ${formatNumber(ctx.raw)}${valueUnit}`;
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
              ticks: { color: colors.tickColor, callback: v => formatNumber(v) + valueUnit }
            }
          }
        }
      });
    }
  }

  function setView(view) {
    currentView = view;
    const isDark = document.documentElement.classList.contains('dark');

    const btnBar = document.getElementById(`${prefix}-btnBarView`);
    const btnLine = document.getElementById(`${prefix}-btnLineView`);

    const inactiveClasses = isDark
      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      : 'bg-stone-400 text-gray-900 hover:bg-stone-500';
    btnBar.className = `px-4 py-2 rounded text-sm font-medium ${view === 'bar' ? 'bg-yellow-500 text-black' : inactiveClasses}`;
    btnLine.className = `px-4 py-2 rounded text-sm font-medium ${view === 'line' ? 'bg-yellow-500 text-black' : inactiveClasses}`;

    document.getElementById(`${prefix}-barControls`).classList.toggle('hidden', view !== 'bar');
    document.getElementById(`${prefix}-lineControls`).classList.toggle('hidden', view !== 'line');
    document.getElementById(`${prefix}-barChartContainer`).classList.toggle('hidden', view !== 'bar');
    document.getElementById(`${prefix}-lineChartContainer`).classList.toggle('hidden', view !== 'line');

    renderLegend();

    if (view === 'bar') {
      updateBarChart();
    } else {
      renderCountrySelector();
      updateLineChart();
    }
  }

  function populateSelectors() {
    const durations = data.metadata?.available_durations || [];

    // Duration selector (instead of year)
    const durationSelect = document.getElementById(`${prefix}-durationSelect`);
    durationSelect.innerHTML = durations.map(d =>
      `<option value="${d}">${d}</option>`
    ).join('');
    durationSelect.value = currentDuration;

    // Regions
    const allRegions = new Set();
    Object.values(data.data).forEach(items => {
      items.forEach(item => allRegions.add(item.region));
    });
    const regions = ["all", ...Array.from(allRegions).sort()];

    const regionSelect = document.getElementById(`${prefix}-regionSelect`);
    regionSelect.innerHTML = regions.map(r =>
      `<option value="${r}">${r === "all" ? "All" : r}</option>`
    ).join('');

    const lineRegionSelect = document.getElementById(`${prefix}-lineRegionFilter`);
    lineRegionSelect.innerHTML = regions.map(r =>
      `<option value="${r}">${r === "all" ? "All regions" : r}</option>`
    ).join('');
  }

  function setupEventListeners() {
    document.getElementById(`${prefix}-durationSelect`).addEventListener('change', (e) => {
      currentDuration = e.target.value;
      updateBarChart();
    });

    document.getElementById(`${prefix}-regionSelect`).addEventListener('change', (e) => {
      currentRegion = e.target.value;
      updateBarChart();
    });

    document.getElementById(`${prefix}-sortSelect`).addEventListener('change', (e) => {
      currentSort = e.target.value;
      updateBarChart();
    });

    document.getElementById(`${prefix}-btnBarView`).addEventListener('click', () => setView('bar'));
    document.getElementById(`${prefix}-btnLineView`).addEventListener('click', () => setView('line'));

    document.getElementById(`${prefix}-btnClearCountries`).addEventListener('click', () => {
      selectedCountries.clear();
      renderCountrySelector();
      updateLineChart();
    });

    document.getElementById(`${prefix}-lineRegionFilter`).addEventListener('change', (e) => {
      lineRegionFilter = e.target.value;
      renderCountrySelector();
    });
  }

  function load() {
    if (data) {
      setView(currentView);
      return;
    }

    fetch(dataFile)
      .then(res => {
        if (!res.ok) throw new Error('Data file not found');
        return res.json();
      })
      .then(jsonData => {
        data = jsonData;
        setupEventListeners();
        renderLegend();
        populateSelectors();
        updateBarChart();
      })
      .catch(err => {
        document.getElementById(`${prefix}-subtitle`).innerHTML =
          `<span class="text-red-400">Error: ${err.message}</span><br>
           <span class="text-gray-500">Run the GitHub Action to generate data.</span>`;
      });
  }

  return { load };
})();

registerPageModule('bonds', bondsModule);
