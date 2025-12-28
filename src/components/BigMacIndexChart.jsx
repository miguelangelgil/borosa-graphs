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
  'Middle East': '#ef4444',
  'Africa': '#6366f1'
};

export default function BigMacIndexChart({ data }) {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const colors = getThemeColors(isDark);

    const chartData = {
      labels: data.map(d => d.country),
      datasets: [{
        label: 'Price (USD)',
        data: data.map(d => d.price_usd),
        backgroundColor: data.map(d => {
          // High stress (>50%) = red
          if (d.risk_level === 'high') return '#ef4444';
          // Medium stress (>25%) = orange
          if (d.risk_level === 'medium') return '#f59e0b';
          // Low stress = region color
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
                `Price: $${item.price_usd.toFixed(2)}`,
                `Valuation: ${item.valuation_pct > 0 ? '+' : ''}${item.valuation_pct}%`,
                `Status: ${item.status}`,
                `Affordability Stress: ${item.affordability_stress.toFixed(1)}%`,
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
            callback: v => '$' + v.toFixed(2)
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 10 } }
        }
      }
    };

    // Add average price line
    const avgPrice = data.reduce((sum, d) => sum + d.price_usd, 0) / data.length;

    const plugins = [{
      id: 'averageLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const avgX = xAxis.getPixelForValue(avgPrice);

        if (avgX > xAxis.left && avgX < xAxis.right) {
          ctx.save();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(avgX, yAxis.top);
          ctx.lineTo(avgX, yAxis.bottom);
          ctx.stroke();

          // Add label
          ctx.fillStyle = colors.labelColor;
          ctx.font = '11px sans-serif';
          ctx.fillText(`Avg: $${avgPrice.toFixed(2)}`, avgX + 5, yAxis.top + 15);

          ctx.restore();
        }
      }
    }];

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
