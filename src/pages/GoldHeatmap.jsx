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

const INSTRUMENTS = [
  { id: 'gold', name: 'Gold', dataFile: './data/gold_heatmap_data.json', historyFile: './data/gold_heatmap_history.json', icon: '🥇', available: true },
  { id: 'silver', name: 'Silver', dataFile: './data/silver_heatmap_data.json', historyFile: './data/silver_heatmap_history.json', icon: '🥈', available: true },
  { id: 'copper', name: 'Copper', dataFile: './data/copper_heatmap_data.json', historyFile: './data/copper_heatmap_history.json', icon: '🟤', available: true, lowLiquidity: true },
  { id: 'sp500', name: 'S&P 500', dataFile: './data/sp500_heatmap_data.json', historyFile: './data/sp500_heatmap_history.json', icon: '📈', available: true },
  { id: 'nasdaq', name: 'Nasdaq', dataFile: './data/nasdaq_heatmap_data.json', historyFile: './data/nasdaq_heatmap_history.json', icon: '💻', available: true },
  { id: 'nikkei', name: 'Nikkei', dataFile: './data/nikkei_heatmap_data.json', historyFile: './data/nikkei_heatmap_history.json', icon: '🗾', available: true },
  { id: 'dax', name: 'DAX', dataFile: './data/dax_heatmap_data.json', historyFile: './data/dax_heatmap_history.json', icon: '🇩🇪', available: true, lowLiquidity: true }
];

export default function GoldHeatmap() {
  const { isDark } = useTheme();
  const [instrument, setInstrument] = useState('gold');
  const [view, setView] = useState('price'); // 'price', 'heatmap', 'temporal', 'cot', or 'history'

  const currentInstrument = INSTRUMENTS.find(i => i.id === instrument);
  const { data, loading, error } = useChartData(currentInstrument.dataFile);
  const { data: historyData } = useChartData(currentInstrument.historyFile);

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
    // Get scale factor from metadata (10 for gold, 1 for most others)
    const scaleFactor = data.metadata?.scale_factor || 1;

    const chartData = {
      labels: levels.map(d => `$${(d.strike * scaleFactor).toFixed(0)}`),
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
            title: (ctx) => {
              const level = levels[ctx[0].dataIndex];
              const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
              return `Strike: ${ctx[0].label} (${etfSymbol} $${level.strike})`;
            },
            label: (ctx) => {
              const level = levels[ctx.dataIndex];
              const scaledStrike = (level.strike * scaleFactor).toFixed(0);
              return [
                `${ctx.dataset.label}: ${formatVolume(ctx.raw)}`,
                `Total: ${formatVolume(level.total_volume)}`,
                `Net: ${level.net_volume > 0 ? '+' : ''}${formatVolume(level.net_volume)}`,
                scaleFactor > 1 ? `Scaled equivalent: $${scaledStrike}` : ''
              ].filter(Boolean);
            },
            afterBody: (ctx) => {
              const level = levels[ctx[0].dataIndex];
              const scaledStrike = level.strike * scaleFactor;
              const futuresPrice = data.metadata?.futures_price || data.metadata?.current_price || 0;
              const diff = Math.abs(scaledStrike - futuresPrice);
              const threshold = futuresPrice * 0.05; // Within 5%
              if (diff < threshold) {
                return `\n💰 Near current price`;
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

        // Find closest strike to futures price (strikes are scaled)
        const futuresPrice = data.metadata?.futures_price || data.metadata?.current_price || 0;
        const instrumentName = data.metadata?.instrument || 'Price';
        let closestIndex = 0;
        let minDiff = Math.abs((levels[0].strike * scaleFactor) - futuresPrice);
        levels.forEach((level, i) => {
          const diff = Math.abs((level.strike * scaleFactor) - futuresPrice);
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
        ctx.fillText(`${instrumentName} $${futuresPrice.toFixed(0)}`, x, yAxis.top - 5);
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
    // Get scale factor and prices from metadata
    const scaleFactor = data.metadata?.scale_factor || 1;
    const futuresPrice = data.metadata?.futures_price || data.metadata?.current_price || 0;
    const instrumentName = data.metadata?.instrument || currentInstrument.name;

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
        y: maxVolumeStrike.strike * scaleFactor,
        originalStrike: maxVolumeStrike.strike,
        date: optDate,
        volume: maxVolumeStrike.call_volume + maxVolumeStrike.put_volume,
        netPosition: maxVolumeStrike.net_volume
      };
    }).filter(p => p !== null);

    // Calculate volume-weighted average price (VWAP) trajectory
    const vwapTrajectory = optionDates.map(optDate => {
      const dateIndex = dates.indexOf(optDate);
      if (dateIndex === -1) return null;

      // Get all options data for this expiration date
      const dayData = heatmapData.filter(item => item.date === optDate);

      if (dayData.length === 0) return null;

      // Calculate volume-weighted average strike
      let totalWeightedStrike = 0;
      let totalVolume = 0;

      dayData.forEach(item => {
        const volume = item.call_volume + item.put_volume;
        totalWeightedStrike += item.strike * volume;
        totalVolume += volume;
      });

      const vwapStrike = totalVolume > 0 ? totalWeightedStrike / totalVolume : 0;

      return {
        x: dateIndex,
        y: vwapStrike * scaleFactor,
        originalStrike: vwapStrike,
        date: optDate,
        totalVolume: totalVolume
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
          y: strike * scaleFactor,
          originalStrike: strike,
          r: Math.sqrt(item.call_volume) / 10,
          volume: item.call_volume,
          date: item.date
        });
      }

      if (item.put_volume > 0) {
        putBubbles.push({
          x: dateIndex,
          y: strike * scaleFactor,
          originalStrike: strike,
          r: Math.sqrt(item.put_volume) / 10,
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
          order: 4,
          yAxisID: 'y'
        },
        {
          label: 'Put Positions',
          type: 'bubble',
          data: putBubbles,
          backgroundColor: 'rgba(239, 68, 68, 0.4)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
          order: 4,
          yAxisID: 'y'
        },
        {
          label: 'Max Volume Target',
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
          order: 3,
          yAxisID: 'y'
        },
        {
          label: 'Volume-Weighted Avg',
          type: 'line',
          data: vwapTrajectory,
          borderColor: '#06b6d4',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#06b6d4',
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

              // If it's the futures price line (dataset 4)
              if (ctx[0].datasetIndex === 4) {
                return date;
              }

              // If it's the max volume trajectory (dataset 2)
              if (ctx[0].datasetIndex === 2) {
                const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
                return `${point.date} - Max Volume Target (${etfSymbol} $${point.originalStrike})`;
              }

              // If it's the VWAP trajectory (dataset 3)
              if (ctx[0].datasetIndex === 3) {
                const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
                return `${point.date} - Volume-Weighted Avg (${etfSymbol} $${point.originalStrike.toFixed(2)})`;
              }

              // For options bubbles (datasets 0 and 1)
              const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
              const scaleText = scaleFactor > 1 ? ` - Scaled: $${point.y.toFixed(0)}` : '';
              return `${point.date || date}${scaleText} (${etfSymbol} $${point.originalStrike})`;
            },
            label: (ctx) => {
              const point = ctx.raw;

              // If it's the futures price line (dataset 4)
              if (ctx.datasetIndex === 4) {
                return `${instrumentName} Futures: ${formatPrice(point.y)}`;
              }

              // If it's the max volume trajectory (dataset 2)
              if (ctx.datasetIndex === 2) {
                const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
                return [
                  `Max Volume Strike: ${formatPrice(point.y)}${scaleFactor > 1 ? ` (${etfSymbol} $${point.originalStrike})` : ''}`,
                  `Total Volume: ${formatVolume(point.volume)}`,
                  `Net: ${point.netPosition > 0 ? 'Bullish ↗️' : 'Bearish ↘️'} (${point.netPosition > 0 ? '+' : ''}${formatVolume(point.netPosition)})`
                ];
              }

              // If it's the VWAP trajectory (dataset 3)
              if (ctx.datasetIndex === 3) {
                const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
                return [
                  `Volume-Weighted Avg: ${formatPrice(point.y)}${scaleFactor > 1 ? ` (${etfSymbol} $${point.originalStrike.toFixed(2)})` : ''}`,
                  `Total Volume: ${formatVolume(point.totalVolume)}`,
                  point.y > futuresPrice ? '↗️ Above current price' : '↘️ Below current price'
                ];
              }

              // For options bubbles (datasets 0=Calls, 1=Puts)
              const type = ctx.datasetIndex === 0 ? 'Calls' : 'Puts';
              const etfSymbol = data.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';
              return [
                `${type}: ${formatVolume(point.volume)} contracts`,
                scaleFactor > 1 ? `Scaled price: ${formatPrice(point.y)}` : `Price: ${formatPrice(point.y)}`,
                `${etfSymbol} strike: $${point.originalStrike.toFixed(2)}`,
                point.y > futuresPrice ? '↗️ Above current price' : '↘️ Below current price'
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
            text: `${instrumentName} Price ${scaleFactor > 1 ? `(strikes scaled x${scaleFactor})` : ''}`,
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

        // Draw top call strikes (bullish targets)
        topCallStrikes.forEach((strike, index) => {
          const y = yAxis.getPixelForValue(strike.strike * scaleFactor);
          const alpha = 0.7 - (index * 0.2);

          ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
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
          ctx.fillText(`↗ $${(strike.strike * scaleFactor).toFixed(0)} (${formatVolume(strike.total_call_volume)})`, xAxis.right - 5, y - 3);
        });

        // Draw top put strikes (bearish targets)
        topPutStrikes.forEach((strike, index) => {
          const y = yAxis.getPixelForValue(strike.strike * scaleFactor);
          const alpha = 0.7 - (index * 0.2);

          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
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
          ctx.fillText(`↘ $${(strike.strike * scaleFactor).toFixed(0)} (${formatVolume(strike.total_put_volume)})`, xAxis.right - 5, y + 10);
        });

        // Draw futures current price line (on top)
        const y = yAxis.getPixelForValue(futuresPrice);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(xAxis.left, y);
        ctx.lineTo(xAxis.right, y);
        ctx.stroke();

        // Current price label
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${instrumentName} Current: $${futuresPrice.toFixed(0)}`, xAxis.left + 5, y - 5);

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

    // Get scale factor and instrument name
    const scaleFactor = data?.metadata?.scale_factor || 1;
    const instrumentName = data?.metadata?.instrument || currentInstrument.name;

    // Prepare chart data
    const chartData = {
      labels: snapshots.map(s => s.date),
      datasets: [
        {
          label: `Actual ${instrumentName} Price`,
          type: 'line',
          data: snapshots.map(s => s.futures_price || s.gold_futures_price),
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
          label: `Top Call Strike${scaleFactor > 1 ? ` (x${scaleFactor})` : ''}`,
          type: 'line',
          data: snapshots.map(s => s.top_strikes?.calls?.[0]?.strike * scaleFactor || null),
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
          label: `Top Put Strike${scaleFactor > 1 ? ` (x${scaleFactor})` : ''}`,
          type: 'line',
          data: snapshots.map(s => s.top_strikes?.puts?.[0]?.strike * scaleFactor || null),
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
              const futuresPrice = snapshot.futures_price || snapshot.gold_futures_price;
              const etfPrice = snapshot.etf_price || snapshot.gld_etf_price;
              const etfSymbol = data?.metadata?.source?.match(/\(([A-Z]+) options\)/)?.[1] || 'ETF';

              if (ctx.datasetIndex === 0) {
                // Actual price
                return [
                  `${instrumentName} Futures: ${formatPrice(futuresPrice)}`,
                  `${etfSymbol}: ${formatPrice(etfPrice)}`,
                ];
              } else if (ctx.datasetIndex === 1) {
                // Top call strike
                const topCall = snapshot.top_strikes?.calls?.[0];
                if (!topCall) return 'No call data';
                const scaledStrike = (topCall.strike * scaleFactor).toFixed(0);
                return [
                  `Top Call Strike: $${scaledStrike}${scaleFactor > 1 ? ` (${etfSymbol} $${topCall.strike})` : ''}`,
                  `Volume: ${formatVolume(topCall.total_call_volume)}`,
                  `Open Interest: ${formatVolume(topCall.total_call_oi)}`,
                  topCall.strike * scaleFactor > futuresPrice ? '↗️ Bullish bet' : '↘️ Below current price'
                ];
              } else if (ctx.datasetIndex === 2) {
                // Top put strike
                const topPut = snapshot.top_strikes?.puts?.[0];
                if (!topPut) return 'No put data';
                const scaledStrike = (topPut.strike * scaleFactor).toFixed(0);
                return [
                  `Top Put Strike: $${scaledStrike}${scaleFactor > 1 ? ` (${etfSymbol} $${topPut.strike})` : ''}`,
                  `Volume: ${formatVolume(topPut.total_put_volume)}`,
                  `Open Interest: ${formatVolume(topPut.total_put_oi)}`,
                  topPut.strike * scaleFactor < futuresPrice ? '↘️ Bearish bet' : '↗️ Above current price'
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
            text: `Price${scaleFactor > 1 ? ` - Strikes scaled x${scaleFactor}` : ''}`,
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
    const instrumentName = data?.metadata?.instrument || currentInstrument.name;
    if (view === 'price') return `🔥 ${instrumentName} Futures Price`;
    if (view === 'heatmap') return `🔥 ${instrumentName} Options Volume by Strike`;
    if (view === 'temporal') return `🔥 ${instrumentName} Options Timeline`;
    if (view === 'history') return `🔥 ${instrumentName} Predictions vs Reality`;
    return `🔥 ${instrumentName} COT Positioning`;
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

      {/* Instrument Selector */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
          Instrument:
        </label>
        <div className="inline-flex gap-2 flex-wrap">
          {INSTRUMENTS.filter(inst => inst.available).map(inst => (
            <button
              key={inst.id}
              onClick={() => setInstrument(inst.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors relative ${
                instrument === inst.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              title={inst.lowLiquidity ? `${inst.name} - Low options liquidity` : inst.name}
            >
              {inst.icon} {inst.name}
              {inst.lowLiquidity && (
                <span className="ml-1 text-xs opacity-60">⚠️</span>
              )}
            </button>
          ))}
        </div>
      </div>

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
