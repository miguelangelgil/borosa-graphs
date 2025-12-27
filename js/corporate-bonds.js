// Corporate Bonds module
// Shows Investment Grade vs High Yield corporate bond yields

const corporateBondsModule = (function() {
  const prefix = 'corpbonds';
  const dataFile = './data/corporate_bonds_data.json';

  let data = null;
  let barChart = null;
  let lineChart = null;
  let currentCategory = "all";
  let currentRegion = "all";
  let currentView = "bar";
  let selectedSeries = new Set(['US_IG', 'US_HY', 'EU_HY', 'EM_TOTAL', 'ASIA_EM', 'LATAM_EM']);
  let lineRegionFilter = "all";

  const categoryColors = {
    "Investment Grade": "#22c55e",  // Green
    "High Yield": "#ef4444",        // Red
    "Spreads": "#f59e0b"            // Amber
  };

  // Base colors by region (used for legend and line charts)
  const regionColors = {
    "North America": "#3b82f6",     // Blue
    "Europe": "#8b5cf6",            // Purple
    "Asia": "#f59e0b",              // Amber
    "Latin America": "#10b981",     // Emerald
    "Emerging Markets": "#ec4899",  // Pink
    "EMEA": "#06b6d4"               // Cyan
  };

  // Color shades by region and category
  // Investment Grade = lighter, High Yield = darker, Spreads = medium/muted
  const regionCategoryColors = {
    "North America": {
      "Investment Grade": "#60a5fa",  // Blue-400 (lighter)
      "High Yield": "#1d4ed8",        // Blue-700 (darker)
      "Spreads": "#3b82f6"            // Blue-500 (medium)
    },
    "Europe": {
      "Investment Grade": "#a78bfa",  // Purple-400 (lighter)
      "High Yield": "#6d28d9",        // Purple-700 (darker)
      "Spreads": "#8b5cf6"            // Purple-500 (medium)
    },
    "Asia": {
      "Investment Grade": "#fbbf24",  // Amber-400 (lighter)
      "High Yield": "#b45309",        // Amber-700 (darker)
      "Spreads": "#f59e0b"            // Amber-500 (medium)
    },
    "Latin America": {
      "Investment Grade": "#34d399",  // Emerald-400 (lighter)
      "High Yield": "#047857",        // Emerald-700 (darker)
      "Spreads": "#10b981"            // Emerald-500 (medium)
    },
    "Emerging Markets": {
      "Investment Grade": "#f472b6",  // Pink-400 (lighter)
      "High Yield": "#be185d",        // Pink-700 (darker)
      "Spreads": "#ec4899"            // Pink-500 (medium)
    },
    "EMEA": {
      "Investment Grade": "#22d3ee",  // Cyan-400 (lighter)
      "High Yield": "#0e7490",        // Cyan-700 (darker)
      "Spreads": "#06b6d4"            // Cyan-500 (medium)
    }
  };

  // Get color based on region and category
  function getColor(region, category) {
    if (regionCategoryColors[region] && regionCategoryColors[region][category]) {
      return regionCategoryColors[region][category];
    }
    return regionColors[region] || '#888';
  }

  const lineColors = [
    '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#06b6d4',
    '#22c55e', '#16a34a', '#15803d',
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    '#f59e0b', '#d97706'
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
      // Show region colors with category shades
      let html = '';
      for (const [region, baseColor] of Object.entries(regionColors)) {
        const igColor = regionCategoryColors[region]["Investment Grade"];
        const hyColor = regionCategoryColors[region]["High Yield"];
        html += `<span class="flex items-center gap-1 mr-3">
          <span class="w-3 h-3 rounded" style="background: linear-gradient(to right, ${igColor}, ${hyColor})"></span>
          ${region}
        </span>`;
      }
      // Add category explanation
      html += `<span class="text-gray-500 ml-2">|</span>`;
      html += `<span class="flex items-center gap-1 ml-2 text-gray-500">Lighter = IG</span>`;
      html += `<span class="flex items-center gap-1 text-gray-500">Darker = HY</span>`;
      legend.innerHTML = html;
    } else {
      legend.innerHTML = '';
    }
  }

  function getFilteredBarData() {
    let items = [];

    for (const [category, bonds] of Object.entries(data.current)) {
      // When "all" is selected, exclude Spreads (they use different units - basis points vs yield %)
      if (currentCategory === "all" && category === "Spreads") {
        continue;
      }
      if (currentCategory === "all" || currentCategory === category) {
        for (const bond of bonds) {
          // Filter by region
          if (currentRegion !== "all" && bond.region !== currentRegion) {
            continue;
          }
          items.push({
            ...bond,
            category: category
          });
        }
      }
    }

    return items.sort((a, b) => b.value - a.value);
  }

  function updateBarChart() {
    const items = getFilteredBarData();
    const colors = getThemeColors();

    const containerHeight = Math.max(300, items.length * 45 + 50);
    document.getElementById(`${prefix}-barChartContainer`).style.height = containerHeight + 'px';

    const avg = items.length > 0 ? items.reduce((sum, d) => sum + d.value, 0) / items.length : 0;

    // Spreads use basis points (percentage points), yields use %
    const isSpreads = currentCategory === "Spreads";
    const unit = isSpreads ? " bps" : "%";
    const titleSuffix = isSpreads ? " - Spreads (vs Treasury)" : "";

    document.getElementById(`${prefix}-title`).textContent = `🏢 Corporate Bond Yields${titleSuffix}`;
    document.getElementById(`${prefix}-subtitle`).textContent =
      `${items.length} indices · Average: ${formatNumber(avg)}${unit} · Updated: ${data.metadata?.fetched_at?.split('T')[0] || 'N/A'}`;

    const chartData = {
      labels: items.map(d => d.name),
      datasets: [{
        label: 'Yield',
        data: items.map(d => d.value),
        backgroundColor: items.map(d => getColor(d.region, d.category)),
        borderRadius: 4,
        barThickness: 28
      }]
    };

    if (barChart) {
      barChart.data = chartData;
      barChart.options.scales.x.grid.color = colors.gridColor;
      barChart.options.scales.x.ticks.color = colors.tickColor;
      barChart.options.scales.x.ticks.callback = v => formatNumber(v) + unit;
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
        }
      });
    }
  }

  function renderSeriesSelector() {
    const container = document.getElementById(`${prefix}-seriesSelector`);
    let allSeries = Object.entries(data.timeseries)
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => {
        // Sort by region first, then by category, then by name
        if (a.region !== b.region) {
          return a.region.localeCompare(b.region);
        }
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
      });

    // Filter by region if selected
    if (lineRegionFilter !== "all") {
      allSeries = allSeries.filter(s => s.region === lineRegionFilter);
    }

    const isDark = document.documentElement.classList.contains('dark');

    container.innerHTML = allSeries.map(s => {
      const isSelected = selectedSeries.has(s.code);
      const seriesColor = getColor(s.region, s.category);
      const unselectedClasses = isDark
        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
        : 'bg-stone-400 text-gray-900 hover:bg-stone-500';
      return `<span
        class="country-chip px-2 py-1 rounded text-xs cursor-pointer transition-all font-medium ${isSelected ? 'text-white hover:opacity-80' : unselectedClasses}"
        style="${isSelected ? `background-color: ${seriesColor}` : ''}"
        data-code="${s.code}"
        title="${s.region} · ${s.category} · ${s.description}"
      >${s.name}</span>`;
    }).join('');

    container.querySelectorAll('.country-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const code = chip.dataset.code;
        if (selectedSeries.has(code)) {
          selectedSeries.delete(code);
        } else {
          selectedSeries.add(code);
        }
        renderSeriesSelector();
        updateLineChart();
      });
    });
  }

  function updateLineChart() {
    const colors = getThemeColors();

    document.getElementById(`${prefix}-title`).textContent = '📈 Corporate Bond Yields - Historical';
    document.getElementById(`${prefix}-subtitle`).textContent =
      `${selectedSeries.size} series selected · Updated: ${data.metadata?.fetched_at?.split('T')[0] || 'N/A'}`;

    // Get all unique dates
    const allDates = new Set();
    selectedSeries.forEach(code => {
      const series = data.timeseries[code];
      if (series) {
        series.data.forEach(d => allDates.add(d.date));
      }
    });
    const sortedDates = Array.from(allDates).sort();

    // Show only labels for every 12th month (yearly)
    const labelIndices = new Set();
    sortedDates.forEach((date, i) => {
      if (date.endsWith('-01') || i === sortedDates.length - 1) {
        labelIndices.add(i);
      }
    });

    const datasets = [];
    let colorIndex = 0;

    selectedSeries.forEach(code => {
      const series = data.timeseries[code];
      if (!series) return;

      const color = getColor(series.region, series.category);
      colorIndex++;

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
      labels: sortedDates.map(d => d.substring(0, 7)),  // YYYY-MM
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
                callback: function(value, index) {
                  const label = this.getLabelForValue(value);
                  // Show year labels
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
      renderSeriesSelector();
      updateLineChart();
    }
  }

  function populateSelectors() {
    const categories = ["all", ...data.metadata.categories];
    const regions = ["all", ...(data.metadata.regions || [])];

    const categorySelect = document.getElementById(`${prefix}-categorySelect`);
    categorySelect.innerHTML = categories.map(c =>
      `<option value="${c}">${c === "all" ? "All Categories" : c}</option>`
    ).join('');

    const regionSelect = document.getElementById(`${prefix}-regionSelect`);
    regionSelect.innerHTML = regions.map(r =>
      `<option value="${r}">${r === "all" ? "All Regions" : r}</option>`
    ).join('');

    const lineRegionSelect = document.getElementById(`${prefix}-lineRegionFilter`);
    lineRegionSelect.innerHTML = regions.map(r =>
      `<option value="${r}">${r === "all" ? "All Regions" : r}</option>`
    ).join('');
  }

  function setupEventListeners() {
    document.getElementById(`${prefix}-categorySelect`).addEventListener('change', (e) => {
      currentCategory = e.target.value;
      updateBarChart();
    });

    document.getElementById(`${prefix}-regionSelect`).addEventListener('change', (e) => {
      currentRegion = e.target.value;
      updateBarChart();
    });

    document.getElementById(`${prefix}-btnBarView`).addEventListener('click', () => setView('bar'));
    document.getElementById(`${prefix}-btnLineView`).addEventListener('click', () => setView('line'));

    document.getElementById(`${prefix}-btnClearSeries`).addEventListener('click', () => {
      selectedSeries.clear();
      renderSeriesSelector();
      updateLineChart();
    });

    document.getElementById(`${prefix}-lineRegionFilter`).addEventListener('change', (e) => {
      lineRegionFilter = e.target.value;
      renderSeriesSelector();
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

registerPageModule('corporate-bonds', corporateBondsModule);
