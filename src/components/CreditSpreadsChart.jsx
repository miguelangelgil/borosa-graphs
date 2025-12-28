import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { getThemeColors } from '../utils/chartUtils';

const categoryColors = {
  'Investment Grade': '#3b82f6',
  'High Yield': '#ef4444',
  'Spreads': '#8b5cf6'
};

export default function CreditSpreadsChart({ data }) {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const colors = getThemeColors(isDark);

    const chartData = {
      labels: data.map(d => d.name),
      datasets: [{
        label: 'Credit Spread',
        data: data.map(d => d.spread),
        backgroundColor: data.map(d => categoryColors[d.category] || '#888'),
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
                `Spread: ${item.spread.toFixed(2)} bps`,
                `Corporate Yield: ${item.corp_yield.toFixed(2)}%`,
                `Government Yield: ${item.gov_yield.toFixed(2)}%`,
                `Category: ${item.category}`,
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
            callback: v => v.toFixed(0) + ' bps'
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 10 } }
        }
      }
    };

    const plugins = [{
      id: 'warningLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const warningX = xAxis.getPixelForValue(500);

        if (warningX > xAxis.left && warningX < xAxis.right) {
          ctx.save();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(warningX, yAxis.top);
          ctx.lineTo(warningX, yAxis.bottom);
          ctx.stroke();

          // Add label
          ctx.fillStyle = colors.labelColor;
          ctx.font = '11px sans-serif';
          ctx.fillText('500 (high risk)', warningX + 5, yAxis.top + 15);

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
