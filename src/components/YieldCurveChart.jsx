import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { regionColors, getThemeColors } from '../utils/chartUtils';

export default function YieldCurveChart({ data }) {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const colors = getThemeColors(isDark);

    // Separate inverted and normal curves
    const inverted = data.filter(d => d.inverted);
    const normal = data.filter(d => !d.inverted);

    const chartData = {
      labels: data.map(d => d.country),
      datasets: [{
        label: 'Yield Spread (10Y-2Y)',
        data: data.map(d => d.spread),
        backgroundColor: data.map(d => d.inverted ? '#ef4444' : regionColors[d.region] || '#888'),
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
              const item = data[ctx.dataIndex];
              return [
                `Spread: ${item.spread.toFixed(2)} bps`,
                `10Y: ${item.yield_10y.toFixed(2)}%`,
                `2Y: ${item.yield_2y.toFixed(2)}%`,
                `Status: ${item.inverted ? 'INVERTED ⚠️' : 'Normal'}`,
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
          ticks: { color: colors.labelColor, font: { size: 11 } }
        }
      }
    };

    const plugins = [{
      id: 'zeroLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const zeroX = xAxis.getPixelForValue(0);

        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(zeroX, yAxis.top);
        ctx.lineTo(zeroX, yAxis.bottom);
        ctx.stroke();
        ctx.restore();
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
