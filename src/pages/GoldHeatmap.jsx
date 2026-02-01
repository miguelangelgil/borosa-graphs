import { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { useTheme } from '../hooks/useTheme';
import { useChartData } from '../hooks/useChartData';
import { getThemeColors } from '../utils/chartUtils';
import { ViewToggle } from '../components/ChartControls';
import InfoTooltip from '../components/InfoTooltip';

Chart.register(...registerables);

function formatPrice(num) {
  return `$${num.toFixed(2)}`;
}

function formatVolume(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default function GoldHeatmap() {
  const { isDark } = useTheme();
  const { data, loading, error } = useChartData('./data/gold_heatmap_data.json');
  const { data: historyData } = useChartData('./data/gold_heatmap_history.json');

  const [view, setView] = useState('price'); // 'price', 'heatmap', 'temporal', 'cot', or 'history'

  const priceChartRef = useRef(null);
  const heatmapChartRef = useRef(null);
  const temporalChartRef = useRef(null);
  const cotChartRef = useRef(null);
  const historyChartRef = useRef(null);
  const priceChartInstance = useRef(null);
  const heatmapChartInstance = useRef(null);
  const temporalChartInstance = useRef(null);
  const cotChartInstance = useRef(null);
  const historyChartInstance = useRef(null);

  // Price chart effect
  useEffect(() => {
    if (view !== 'price' || !priceChartRef.current || !data?.price_history) {
      // Cleanup if switching away from price view
      if (priceChartInstance.current) {
        priceChartInstance.current.destroy();
        priceChartInstance.current = null;
      }
      return;
    }

    const colors = getThemeColors(isDark);
    const history = data.price_history;

    const chartData = {
      labels: history.map(d => d.date),
      datasets: [{
        label: 'Gold Price',
        data: history.map(d => d.close),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.labelColor,
          bodyColor: colors.tickColor,
          callbacks: {
            title: (ctx) => ctx[0].label,
            label: (ctx) => {
              const item = history[ctx.dataIndex];
              return [
                `Close: ${formatPrice(item.close)}`,
                `Open: ${formatPrice(item.open)}`,
                `High: ${formatPrice(item.high)}`,
                `Low: ${formatPrice(item.low)}`,
                `Volume: ${formatVolume(item.volume)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            maxTicksLimit: 10
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price (USD/oz)',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            callback: v => formatPrice(v)
          }
        }
      }
    };

    if (priceChartInstance.current) {
      priceChartInstance.current.destroy();
      priceChartInstance.current = null;
    }

    priceChartInstance.current = new Chart(priceChartRef.current, {
      type: 'line',
      data: chartData,
      options
    });

    return () => {
      if (priceChartInstance.current) {
        priceChartInstance.current.destroy();
        priceChartInstance.current = null;
      }
    };
  }, [view, data, isDark]);

  // Heat map chart effect (price level concentration)
  useEffect(() => {
    if (view !== 'heatmap' || !heatmapChartRef.current || !data?.price_levels) {
      // Cleanup if switching away from heatmap view
      if (heatmapChartInstance.current) {
        heatmapChartInstance.current.destroy();
        heatmapChartInstance.current = null;
      }
      return;
    }

    const colors = getThemeColors(isDark);
    const levels = data.price_levels;
    // Use GLD ETF price for options (not gold futures price)
    const gldPrice = data.metadata?.gld_etf_price || data.metadata?.current_price / 10 || 0;

    const chartData = {
      labels: levels.map(d => `$${(d.strike * 10).toFixed(0)}`),
      datasets: [
        {
          label: 'Call Volume',
          data: levels.map(d => d.total_call_volume),
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        },
        {
          label: 'Put Volume',
          data: levels.map(d => d.total_put_volume),
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
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
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.labelColor,
          bodyColor: colors.tickColor,
          callbacks: {
            title: (ctx) => `Strike: ${ctx[0].label} (GLD $${levels[ctx[0].dataIndex].strike})`,
            label: (ctx) => {
              const level = levels[ctx.dataIndex];
              return [
                `${ctx.dataset.label}: ${formatVolume(ctx.raw)}`,
                `Total: ${formatVolume(level.total_volume)}`,
                `Net: ${level.net_volume > 0 ? '+' : ''}${formatVolume(level.net_volume)}`,
                `Gold equivalent: $${(level.strike * 10).toFixed(0)}/oz`
              ];
            },
            afterBody: (ctx) => {
              const level = levels[ctx[0].dataIndex];
              const goldEquivalent = level.strike * 10;
              const goldFuturesPrice = data.metadata?.gold_futures_price || 0;
              if (Math.abs(goldEquivalent - goldFuturesPrice) < 200) {
                return `\n💰 Near current gold price`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Strike Price',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          title: {
            display: true,
            text: 'Volume (Contracts)',
            color: colors.labelColor
          },
          stacked: true,
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            callback: v => formatVolume(v)
          }
        }
      }
    };

    // Add vertical line at current price
    const plugins = [{
      id: 'currentPriceLine',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const xAxis = chart.scales.x;
        const yAxis = chart.scales.y;

        // Find closest strike to gold futures price (strikes are multiplied by 10)
        const goldFuturesPrice = data.metadata?.gold_futures_price || 0;
        let closestIndex = 0;
        let minDiff = Math.abs((levels[0].strike * 10) - goldFuturesPrice);
        levels.forEach((level, i) => {
          const diff = Math.abs((level.strike * 10) - goldFuturesPrice);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        });

        const x = xAxis.getPixelForValue(closestIndex);

        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.stroke();
        ctx.restore();

        // Add label
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Gold $${goldFuturesPrice.toFixed(0)}`, x, yAxis.top - 5);
      }
    }];

    if (heatmapChartInstance.current) {
      heatmapChartInstance.current.destroy();
      heatmapChartInstance.current = null;
    }

    heatmapChartInstance.current = new Chart(heatmapChartRef.current, {
      type: 'bar',
      data: chartData,
      options,
      plugins
    });

    return () => {
      if (heatmapChartInstance.current) {
        heatmapChartInstance.current.destroy();
        heatmapChartInstance.current = null;
      }
    };
  }, [view, data, isDark]);

  // Temporal heat map chart effect (time vs strike price)
  useEffect(() => {
    if (view !== 'temporal' || !temporalChartRef.current || !data?.heatmap_data) {
      // Cleanup if switching away from temporal view
      if (temporalChartInstance.current) {
        temporalChartInstance.current.destroy();
        temporalChartInstance.current = null;
      }
      return;
    }

    const colors = getThemeColors(isDark);
    const heatmapData = data.heatmap_data;
    // Use GLD ETF price for options (not gold futures price)
    const gldPrice = data.metadata?.gld_etf_price || data.metadata?.current_price / 10 || 0;
    const goldFuturesPrice = data.metadata?.gold_futures_price || data.metadata?.current_price || 0;

    // Get unique options expiration dates (future dates)
    const optionDates = [...new Set(heatmapData.map(d => d.date))].filter(d => d).sort();

    // Use last 30 days of price history + future option expiration dates
    const priceHistory = data.price_history || [];
    const recentHistory = priceHistory.slice(-30); // Last 30 days
    const historicalDates = recentHistory.map(p => p.date);

    // Combine historical dates + option expiration dates (removing duplicates)
    const allDatesSet = new Set([...historicalDates, ...optionDates]);
    const dates = Array.from(allDatesSet).sort();

    // Get gold price data (only for historical dates, future will be null)
    const priceData = dates.map((date, index) => {
      const priceEntry = priceHistory.find(p => p.date === date);
      if (priceEntry) {
        return {
          x: index,
          y: priceEntry.close,
          date: date
        };
      }
      return null;
    }).filter(p => p !== null);

    // Calculate expected price trajectory (most probable strike per expiration date)
    const expectedTrajectory = optionDates.map(optDate => {
      const dateIndex = dates.indexOf(optDate);
      if (dateIndex === -1) return null;

      // Get all options data for this expiration date
      const dayData = heatmapData.filter(item => item.date === optDate);

      if (dayData.length === 0) return null;

      // Find strike with highest total volume
      const maxVolumeStrike = dayData.reduce((max, item) => {
        const totalVol = item.call_volume + item.put_volume;
        const maxVol = max.call_volume + max.put_volume;
        return totalVol > maxVol ? item : max;
      });

      return {
        x: dateIndex,
        y: maxVolumeStrike.strike * 10, // Multiply by 10 to match gold price scale
        originalStrike: maxVolumeStrike.strike,
        date: optDate,
        volume: maxVolumeStrike.call_volume + maxVolumeStrike.put_volume,
        netPosition: maxVolumeStrike.net_volume
      };
    }).filter(p => p !== null);

    // Create bubble chart data (one dataset for calls, one for puts)
    const callBubbles = [];
    const putBubbles = [];

    heatmapData.forEach(item => {
      const dateIndex = dates.indexOf(item.date);
      if (dateIndex === -1) return; // Skip if expiration date not in timeline

      const strike = item.strike;

      if (item.call_volume > 0) {
        callBubbles.push({
          x: dateIndex,
          y: strike * 10, // Multiply by 10 to match gold price scale
          originalStrike: strike,
          r: Math.sqrt(item.call_volume) / 10, // Scale radius (adjusted for better visibility)
          volume: item.call_volume,
          date: item.date
        });
      }

      if (item.put_volume > 0) {
        putBubbles.push({
          x: dateIndex,
          y: strike * 10, // Multiply by 10 to match gold price scale
          originalStrike: strike,
          r: Math.sqrt(item.put_volume) / 10, // Scale radius (adjusted for better visibility)
          volume: item.put_volume,
          date: item.date
        });
      }
    });

    const chartData = {
      datasets: [
        {
          label: 'Call Positions',
          type: 'bubble',
          data: callBubbles,
          backgroundColor: 'rgba(34, 197, 94, 0.4)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
          order: 3,
          yAxisID: 'y'
        },
        {
          label: 'Put Positions',
          type: 'bubble',
          data: putBubbles,
          backgroundColor: 'rgba(239, 68, 68, 0.4)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
          order: 3,
          yAxisID: 'y'
        },
        {
          label: 'Expected Trajectory',
          type: 'line',
          data: expectedTrajectory,
          borderColor: '#8b5cf6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [10, 5],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.3,
          order: 2,
          yAxisID: 'y'
        },
        {
          label: 'Gold Futures Price',
          type: 'line',
          data: priceData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.2,
          fill: false,
          order: 1, // Draw on top
          yAxisID: 'y'
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: colors.labelColor,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.labelColor,
          bodyColor: colors.tickColor,
          callbacks: {
            title: (ctx) => {
              const point = ctx[0].raw;
              const dateIndex = Math.floor(point.x);
              const date = dates[dateIndex] || '';

              // If it's the gold price line (dataset 3)
              if (ctx[0].datasetIndex === 3) {
                return date;
              }

              // If it's the expected trajectory (dataset 2)
              if (ctx[0].datasetIndex === 2) {
                return `${point.date} - Expected Target (GLD $${point.originalStrike})`;
              }

              // For options bubbles (datasets 0 and 1)
              return `${point.date || date} - Gold equiv: $${point.y.toFixed(0)} (GLD $${point.originalStrike})`;
            },
            label: (ctx) => {
              const point = ctx.raw;

              // If it's the gold price line (dataset 3)
              if (ctx.datasetIndex === 3) {
                return `Gold Futures Price: ${formatPrice(point.y)}`;
              }

              // If it's the expected trajectory (dataset 2)
              if (ctx.datasetIndex === 2) {
                return [
                  `Most Probable: ${formatPrice(point.y)} (GLD $${point.originalStrike})`,
                  `Total Volume: ${formatVolume(point.volume)}`,
                  `Net: ${point.netPosition > 0 ? 'Bullish ↗️' : 'Bearish ↘️'} (${point.netPosition > 0 ? '+' : ''}${formatVolume(point.netPosition)})`
                ];
              }

              // For options bubbles (datasets 0=Calls, 1=Puts)
              const type = ctx.datasetIndex === 0 ? 'Calls' : 'Puts';
              return [
                `${type}: ${formatVolume(point.volume)} contracts`,
                `Gold scale: ${formatPrice(point.y)}`,
                `GLD strike: $${point.originalStrike.toFixed(2)}`,
                point.y > goldFuturesPrice ? '↗️ Above current gold price' : '↘️ Below current gold price'
              ];
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 0,
          max: dates.length - 1,
          title: {
            display: true,
            text: `Timeline: ${historicalDates.length} days history + ${optionDates.length} options expirations → Scroll to explore`,
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            maxTicksLimit: 15,
            callback: (value) => {
              const index = Math.round(value);
              if (index >= 0 && index < dates.length && dates[index]) {
                // Show date in MM-DD format
                return dates[index].substring(5);
              }
              return '';
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Gold Price (USD/oz) - Options strikes scaled x10',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            callback: v => `$${v.toFixed(0)}`
          }
        }
      }
    };

    // Calculate strike levels with highest volume (top 3)
    const strikeLevels = data.price_levels || [];
    const topCallStrikes = [...strikeLevels]
      .sort((a, b) => b.total_call_volume - a.total_call_volume)
      .slice(0, 3);
    const topPutStrikes = [...strikeLevels]
      .sort((a, b) => b.total_put_volume - a.total_put_volume)
      .slice(0, 3);

    // Add horizontal lines at current price and high volume strikes
    const plugins = [{
      id: 'priceLevels',
      beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const yAxis = chart.scales.y;
        const xAxis = chart.scales.x;

        ctx.save();

        // Draw top call strikes (bullish targets) - scaled x10
        topCallStrikes.forEach((strike, index) => {
          const y = yAxis.getPixelForValue(strike.strike * 10); // Scale x10
          const alpha = 0.7 - (index * 0.2); // Fade out lower ranks

          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`; // Green
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(xAxis.left, y);
          ctx.lineTo(xAxis.right, y);
          ctx.stroke();

          // Add label
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`↗ $${(strike.strike * 10).toFixed(0)} (${formatVolume(strike.total_call_volume)})`, xAxis.right - 5, y - 3);
        });

        // Draw top put strikes (bearish targets) - scaled x10
        topPutStrikes.forEach((strike, index) => {
          const y = yAxis.getPixelForValue(strike.strike * 10); // Scale x10
          const alpha = 0.7 - (index * 0.2); // Fade out lower ranks

          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`; // Red
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(xAxis.left, y);
          ctx.lineTo(xAxis.right, y);
          ctx.stroke();

          // Add label
          ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`↘ $${(strike.strike * 10).toFixed(0)} (${formatVolume(strike.total_put_volume)})`, xAxis.right - 5, y + 10);
        });

        // Draw gold futures current price line (on top)
        const y = yAxis.getPixelForValue(goldFuturesPrice);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(xAxis.left, y);
        ctx.lineTo(xAxis.right, y);
        ctx.stroke();

        // Gold current price label
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Gold Current: $${goldFuturesPrice.toFixed(0)}/oz`, xAxis.left + 5, y - 5);

        ctx.restore();
      }
    }];

    if (temporalChartInstance.current) {
      temporalChartInstance.current.destroy();
      temporalChartInstance.current = null;
    }

    temporalChartInstance.current = new Chart(temporalChartRef.current, {
      type: 'bubble',
      data: chartData,
      options,
      plugins
    });

    return () => {
      if (temporalChartInstance.current) {
        temporalChartInstance.current.destroy();
        temporalChartInstance.current = null;
      }
    };
  }, [view, data, isDark]);

  // COT positioning chart effect
  useEffect(() => {
    if (view !== 'cot' || !cotChartRef.current || !data?.cot_data) {
      // Cleanup if switching away from COT view
      if (cotChartInstance.current) {
        cotChartInstance.current.destroy();
        cotChartInstance.current = null;
      }
      return;
    }

    const colors = getThemeColors(isDark);
    const cotData = data.cot_data;
    const priceHistory = data.price_history || [];

    // Calculate net positions
    const chartData = {
      labels: cotData.map(d => d.date),
      datasets: [
        {
          label: 'Gold Price',
          type: 'line',
          data: cotData.map(d => {
            const priceEntry = priceHistory.find(p => p.date === d.date);
            return priceEntry ? priceEntry.close : null;
          }),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y1',
          order: 0
        },
        {
          label: 'Commercial (Hedgers)',
          type: 'line',
          data: cotData.map(d => (d.commercial_long - d.commercial_short) / 1000),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Large Speculators',
          type: 'line',
          data: cotData.map(d => (d.non_commercial_long - d.non_commercial_short) / 1000),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Small Traders',
          type: 'line',
          data: cotData.map(d => (d.non_reportable_long - d.non_reportable_short) / 1000),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: 'y',
          order: 1
        }
      ]
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
            font: { size: 11 }
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
              if (ctx.datasetIndex === 0) {
                return `Gold: ${formatPrice(ctx.raw)}`;
              }
              const value = ctx.raw;
              return `${ctx.dataset.label}: ${value > 0 ? '+' : ''}${value.toFixed(1)}K contracts`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            maxRotation: 45,
            minRotation: 45,
            maxTicksLimit: 12
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Net Position (K contracts)',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            callback: v => `${v > 0 ? '+' : ''}${v.toFixed(0)}K`
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Gold Price (USD/oz)',
            color: colors.labelColor
          },
          grid: { display: false },
          ticks: {
            color: colors.tickColor,
            callback: v => formatPrice(v)
          }
        }
      }
    };

    if (cotChartInstance.current) {
      cotChartInstance.current.destroy();
      cotChartInstance.current = null;
    }

    cotChartInstance.current = new Chart(cotChartRef.current, {
      type: 'line',
      data: chartData,
      options
    });

    return () => {
      if (cotChartInstance.current) {
        cotChartInstance.current.destroy();
        cotChartInstance.current = null;
      }
    };
  }, [view, data, isDark]);

  // History tracking chart effect (weekly snapshots vs actual price)
  useEffect(() => {
    if (view !== 'history' || !historyChartRef.current || !historyData?.snapshots) {
      // Cleanup if switching away from history view
      if (historyChartInstance.current) {
        historyChartInstance.current.destroy();
        historyChartInstance.current = null;
      }
      return;
    }

    const colors = getThemeColors(isDark);
    const snapshots = historyData.snapshots;

    if (snapshots.length === 0) {
      return;
    }

    // Prepare chart data
    const chartData = {
      labels: snapshots.map(s => s.date),
      datasets: [
        {
          label: 'Actual Gold Price',
          type: 'line',
          data: snapshots.map(s => s.gold_futures_price),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: false,
          tension: 0.2,
          order: 1
        },
        {
          label: 'Top Call Strike (x10)',
          type: 'line',
          data: snapshots.map(s => s.top_strikes?.calls?.[0]?.strike * 10 || null),
          borderColor: 'rgba(34, 197, 94, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 3],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'triangle',
          pointBackgroundColor: 'rgba(34, 197, 94, 0.8)',
          tension: 0.2,
          order: 2
        },
        {
          label: 'Top Put Strike (x10)',
          type: 'line',
          data: snapshots.map(s => s.top_strikes?.puts?.[0]?.strike * 10 || null),
          borderColor: 'rgba(239, 68, 68, 0.8)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 3],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointStyle: 'triangle',
          pointBackgroundColor: 'rgba(239, 68, 68, 0.8)',
          tension: 0.2,
          order: 2
        }
      ]
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
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          titleColor: colors.labelColor,
          bodyColor: colors.tickColor,
          callbacks: {
            title: (ctx) => {
              const snapshot = snapshots[ctx[0].dataIndex];
              return `Week of ${snapshot.date}`;
            },
            label: (ctx) => {
              const snapshot = snapshots[ctx.dataIndex];

              if (ctx.datasetIndex === 0) {
                // Actual gold price
                return [
                  `Gold Futures: ${formatPrice(snapshot.gold_futures_price)}`,
                  `GLD ETF: ${formatPrice(snapshot.gld_etf_price)}`,
                ];
              } else if (ctx.datasetIndex === 1) {
                // Top call strike
                const topCall = snapshot.top_strikes?.calls?.[0];
                if (!topCall) return 'No call data';
                return [
                  `Top Call Strike: $${(topCall.strike * 10).toFixed(0)} (GLD $${topCall.strike})`,
                  `Volume: ${formatVolume(topCall.total_call_volume)}`,
                  `Open Interest: ${formatVolume(topCall.total_call_oi)}`,
                  topCall.strike * 10 > snapshot.gold_futures_price ? '↗️ Bullish bet' : '↘️ Below current price'
                ];
              } else if (ctx.datasetIndex === 2) {
                // Top put strike
                const topPut = snapshot.top_strikes?.puts?.[0];
                if (!topPut) return 'No put data';
                return [
                  `Top Put Strike: $${(topPut.strike * 10).toFixed(0)} (GLD $${topPut.strike})`,
                  `Volume: ${formatVolume(topPut.total_put_volume)}`,
                  `Open Interest: ${formatVolume(topPut.total_put_oi)}`,
                  topPut.strike * 10 < snapshot.gold_futures_price ? '↘️ Bearish bet' : '↗️ Above current price'
                ];
              }
            },
            afterBody: (ctx) => {
              const snapshot = snapshots[ctx[0].dataIndex];
              const summary = snapshot.options_summary;
              return [
                '',
                'Options Summary:',
                `Total Call Volume: ${formatVolume(summary.total_call_volume)}`,
                `Total Put Volume: ${formatVolume(summary.total_put_volume)}`,
                `Put/Call Ratio: ${(summary.total_put_volume / summary.total_call_volume).toFixed(2)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          title: {
            display: true,
            text: 'Price (USD/oz) - Strikes scaled x10',
            color: colors.labelColor
          },
          grid: { color: colors.gridColor },
          ticks: {
            color: colors.tickColor,
            callback: v => `$${v.toFixed(0)}`
          }
        }
      }
    };

    if (historyChartInstance.current) {
      historyChartInstance.current.destroy();
      historyChartInstance.current = null;
    }

    historyChartInstance.current = new Chart(historyChartRef.current, {
      type: 'line',
      data: chartData,
      options
    });

    return () => {
      if (historyChartInstance.current) {
        historyChartInstance.current.destroy();
        historyChartInstance.current = null;
      }
    };
  }, [view, historyData, isDark]);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">🔥 Gold Futures Heat Maps</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-1">🔥 Gold Futures Heat Maps</h1>
        <p className="text-red-400 text-sm mb-2">Error: {error}</p>
        <p className="text-gray-500 text-sm">Run the GitHub Action to generate data.</p>
      </div>
    );
  }

  const currentPrice = data?.metadata?.current_price || 0;
  const lastUpdate = data?.metadata?.fetched_at?.split('T')[0] || 'N/A';
  const priceChange = data?.price_history?.length >= 2
    ? data.price_history[data.price_history.length - 1].close - data.price_history[0].close
    : 0;
  const priceChangePercent = data?.price_history?.length >= 2
    ? (priceChange / data.price_history[0].close) * 100
    : 0;

  const infoPrice = "Gold futures prices over the last 6 months. Shows the spot price trend in USD per troy ounce.";
  const infoHeatmap = "Options positioning heat map showing call and put volume concentration. X-axis shows strikes SCALED UP (x10) to match gold price. Original GLD strikes are shown in tooltips. Green bars = call volume (bullish), red bars = put volume (bearish). Yellow line = current gold futures price. Example: Display shows $4,400 = GLD strike of $440.";
  const infoTemporal = "Timeline combining history + future. Orange line = gold futures price history (last 30 days). Y-axis shows gold price scale. OPTIONS STRIKES ARE SCALED x10 to match - hover over bubbles to see original GLD strikes. Green bubbles = calls (bullish), red = puts (bearish). Purple line = most probable price target. Orange dashed line = current gold price. Bubble size = volume. SCROLL RIGHT to see future expirations!";
  const infoCot = "CFTC Commitment of Traders (COT) Report showing real weekly positioning data. Blue line: Commercial traders (hedgers, producers) - typically contrarian. Green line: Large Speculators (hedge funds) - the 'smart money'. Purple line: Small Traders (retail). Orange line: Gold price. Net position = Long - Short positions in thousands of contracts. When commercials are net short and specs are net long, it often signals a potential top.";
  const infoHistory = "Weekly historical snapshots showing if gold price movements match options predictions. Orange line = actual gold futures price. Green dashed line = top call strike (bullish prediction). Red dashed line = top put strike (bearish prediction). Strikes are scaled x10 to match gold price. This view helps evaluate if options traders correctly predicted price movements over time.";

  const getTitle = () => {
    if (view === 'price') return '🔥 Gold Futures Price';
    if (view === 'heatmap') return '🔥 Options Volume by Strike';
    if (view === 'temporal') return '🔥 Options Timeline Heat Map';
    if (view === 'history') return '🔥 Predictions vs Reality';
    return '🔥 COT Positioning Report';
  };

  const getInfo = () => {
    if (view === 'price') return infoPrice;
    if (view === 'heatmap') return infoHeatmap;
    if (view === 'temporal') return infoTemporal;
    if (view === 'history') return infoHistory;
    return infoCot;
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">{getTitle()}</h1>
        <InfoTooltip text={getInfo()} />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
        {view === 'price'
          ? `Current: ${formatPrice(currentPrice)} · Change: ${priceChange >= 0 ? '+' : ''}${formatPrice(priceChange)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%) · Updated: ${lastUpdate}`
          : `Current: ${formatPrice(currentPrice)} · ${data?.price_levels?.length || 0} strike prices · Updated: ${lastUpdate}`
        }
      </p>

      <ViewToggle
        view={view}
        setView={setView}
        options={[
          { value: 'price', label: '📈 Price' },
          { value: 'cot', label: '📊 COT Report' },
          { value: 'heatmap', label: '📉 By Strike' },
          { value: 'temporal', label: '🕒 Timeline' },
          { value: 'history', label: '📊 History' }
        ]}
      />

      {view === 'price' && (
        <div style={{ height: '500px', marginTop: '1rem' }}>
          <canvas ref={priceChartRef}></canvas>
        </div>
      )}

      {view === 'cot' && (
        <div style={{ height: '500px', marginTop: '1rem' }}>
          <canvas ref={cotChartRef}></canvas>
        </div>
      )}

      {view === 'heatmap' && (
        <div style={{ height: '500px', marginTop: '1rem' }}>
          <canvas ref={heatmapChartRef}></canvas>
        </div>
      )}

      {view === 'temporal' && (
        <div style={{ height: '600px', marginTop: '1rem', overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ minWidth: '3000px', height: '100%' }}>
            <canvas ref={temporalChartRef}></canvas>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div style={{ height: '500px', marginTop: '1rem' }}>
          {historyData?.snapshots?.length > 0 ? (
            <canvas ref={historyChartRef}></canvas>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">
                No historical data yet. Run the script weekly to build up a history of predictions vs actual prices.
              </p>
            </div>
          )}
        </div>
      )}

      {data?.metadata?.note && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 italic">
          Note: {data.metadata.note}
        </p>
      )}
    </div>
  );
}
