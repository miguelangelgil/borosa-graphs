import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { regionColors, getThemeColors } from '../utils/chartUtils';

export default function PMIChart({ data }) {
  const { isDark } = useTheme();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const colors = getThemeColors(isDark);

    const chartData = {
      labels: data.map(d => d.country),
      datasets: [{
        label: 'PMI Manufacturing',
        data: data.map(d => d.value),
        backgroundColor: data.map(d => d.status === 'contraction' ? '#ef4444' : regionColors[d.region] || '#888'),
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
                `PMI: ${item.value.toFixed(1)}`,
                `Status: ${item.status === 'contraction' ? 'CONTRACTING ⚠️' : 'Expanding'}`,
                `Distance from 50: ${item.distance_from_50 > 0 ? '+' : ''}${item.distance_from_50.toFixed(1)}`,
                `Region: ${item.region}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          min: 40,
          max: 60,
          grid: {
            color: colors.gridColor,
            drawOnChartArea: true
          },
          ticks: {
            color: colors.tickColor,
            stepSize: 5
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: colors.labelColor, font: { size: 11 } }
        }
      }
    };

    const plugins = [{
      id: 'thresholdLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;
        const threshold = xAxis.getPixelForValue(50);

        ctx.save();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(threshold, yAxis.top);
        ctx.lineTo(threshold, yAxis.bottom);
        ctx.stroke();

        // Add label
        ctx.fillStyle = colors.labelColor;
        ctx.font = '12px sans-serif';
        ctx.fillText('50 (threshold)', threshold + 5, yAxis.top + 15);

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
