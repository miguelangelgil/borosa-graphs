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

export default function ConsumerConfidenceChart({ data }) {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const colors = getThemeColors(isDark);

    const chartData = {
      labels: data.map(d => d.country),
      datasets: [{
        label: 'Consumer Confidence',
        data: data.map(d => d.value),
        backgroundColor: data.map(d =>
          d.value < 100 ? '#ef4444' : (regionColors[d.region] || '#888')
        ),
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
                `Confidence: ${item.value.toFixed(1)}`,
                `Sentiment: ${item.sentiment}`,
                `Change from baseline: ${item.change_from_baseline > 0 ? '+' : ''}${item.change_from_baseline}%`,
                `Strength: ${item.strength}`,
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
            color: colors.tickColor
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 10 } }
        }
      }
    };

    const plugins = [{
      id: 'baselineLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const baselineX = xAxis.getPixelForValue(100);

        if (baselineX > xAxis.left && baselineX < xAxis.right) {
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(baselineX, yAxis.top);
          ctx.lineTo(baselineX, yAxis.bottom);
          ctx.stroke();

          // Add label
          ctx.fillStyle = colors.labelColor;
          ctx.font = '11px sans-serif';
          ctx.fillText('100 (baseline)', baselineX + 5, yAxis.top + 15);

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
