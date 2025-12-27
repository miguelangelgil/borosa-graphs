// Shared chart utilities and configuration

export const regionColors = {
  "Asia": "#f59e0b",
  "Europe": "#3b82f6",
  "Americas": "#10b981",
  "Latam": "#8b5cf6",
  "MENA": "#ef4444",
  "Africa": "#6b7280",
  "Oceania": "#06b6d4"
};

export const lineColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#64748b', '#ffffff'
];

export function getThemeColors(isDark) {
  return {
    gridColor: isDark ? '#1f2937' : '#d1ccc0',
    tickColor: isDark ? '#9ca3af' : '#4b5563',
    labelColor: isDark ? '#e5e7eb' : '#1f2937',
    tooltipBg: isDark ? '#111827' : '#fffef9',
    tooltipBorder: isDark ? '#374151' : '#c4bfb3'
  };
}

export function formatNumber(num, decimals = 1) {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (absNum >= 1e12) return sign + (absNum / 1e12).toFixed(decimals) + 'T';
  if (absNum >= 1e9) return sign + (absNum / 1e9).toFixed(decimals) + 'B';
  if (absNum >= 1e6) return sign + (absNum / 1e6).toFixed(decimals) + 'M';
  if (absNum >= 1e3) return sign + (absNum / 1e3).toFixed(decimals) + 'K';
  return num.toFixed(decimals);
}

export function createBarChartOptions(isDark, items, valueKey, valueUnit, formatFn = formatNumber) {
  const colors = getThemeColors(isDark);

  return {
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
            return [`Value: ${formatFn(d[valueKey])}${valueUnit}`, `Region: ${d.region}`];
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
}

export function createLineChartOptions(isDark, valueUnit, formatFn = formatNumber) {
  const colors = getThemeColors(isDark);

  return {
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
}
