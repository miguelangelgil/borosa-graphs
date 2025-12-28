import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { getThemeColors } from '../utils/chartUtils';

const regionColors = {
  'Americas': '#3b82f6',
  'Europe': '#8b5cf6',
  'Asia': '#10b981',
  'Oceania': '#f59e0b',
  'Latam': '#ec4899',
  'Africa': '#6366f1'
};

export default function UnemploymentClaimsChart({ data }) {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const colors = getThemeColors(isDark);

    const chartData = {
      labels: data.map(d => d.country),
      datasets: [{
        label: 'Claims per Million',
        data: data.map(d => d.claims_per_million),
        backgroundColor: data.map(d => {
          // High risk (>20% increase) = red
          if (d.risk_level === 'high') return '#ef4444';
          // Medium risk (>10% increase) = orange
          if (d.risk_level === 'medium') return '#f59e0b';
          // Low risk or stable = region color
          return regionColors[d.region] || '#888';
        }),
        borderRadius: 4,
        barThickness: 20
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
              const item = data[ctx.dataIndex];
              return [
                `Claims per Million: ${item.claims_per_million.toFixed(0)}`,
                `Total Claims: ${item.claims.toLocaleString()}`,
                `Change: ${item.change_from_baseline > 0 ? '+' : ''}${item.change_from_baseline}%`,
                `Trend: ${item.trend}`,
                `Risk Level: ${item.risk_level.toUpperCase()}`,
                `Region: ${item.region}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: colors.gridColor,
            drawOnChartArea: true
          },
          ticks: {
            color: colors.tickColor,
            callback: v => v.toFixed(0) + '/M'
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 10 } }
        }
      }
    };

    // No threshold line for this chart as the baseline varies by country
    const plugins = [];

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: chartData,
      options,
      plugins
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, isDark]);

  return <canvas ref={chartRef}></canvas>;
}
