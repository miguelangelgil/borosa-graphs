import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useChartData } from '../hooks/useChartData';
import InfoTooltip from '../components/InfoTooltip';
import YieldCurveChart from '../components/YieldCurveChart';
import PMIChart from '../components/PMIChart';
import CreditSpreadsChart from '../components/CreditSpreadsChart';
import ConsumerConfidenceChart from '../components/ConsumerConfidenceChart';
import UnemploymentClaimsChart from '../components/UnemploymentClaimsChart';
import BigMacIndexChart from '../components/BigMacIndexChart';

// Economic zones with countries
const economicZones = {
  "North America": { countries: ["USA", "CAN", "MEX"], color: "#3b82f6" },
  "Europe": { countries: ["DEU", "FRA", "GBR", "ITA", "ESP", "NLD", "POL", "SWE"], color: "#10b981" },
  "Asia Pacific": { countries: ["CHN", "JPN", "IND", "KOR", "AUS", "IDN", "THA"], color: "#f59e0b" },
  "Latin America": { countries: ["BRA", "ARG", "CHL", "COL", "PER"], color: "#8b5cf6" },
  "Middle East": { countries: ["SAU", "ARE", "TUR", "ISR", "EGY"], color: "#ef4444" }
};

const indicators = [
  {
    id: 'yield-curve',
    name: 'Yield Curve (10Y-2Y)',
    description: 'Inverted yield curve (negative spread) historically precedes recessions',
    unit: 'bps'
  },
  {
    id: 'pmi',
    name: 'PMI Manufacturing',
    description: 'Below 50 indicates manufacturing contraction',
    unit: 'index'
  },
  {
    id: 'credit-spread',
    name: 'Credit Spreads',
    description: 'Widening spreads indicate increased credit risk',
    unit: 'bps'
  },
  {
    id: 'unemployment-claims',
    name: 'Unemployment Claims',
    description: 'Rising initial jobless claims signal labor market weakness',
    unit: 'thousands'
  },
  {
    id: 'consumer-confidence',
    name: 'Consumer Confidence',
    description: 'Declining confidence precedes reduced spending',
    unit: 'index'
  },
  {
    id: 'big-mac-index',
    name: 'Big Mac Index',
    description: 'Purchasing power parity indicator - affordability stress signals economic pressure',
    unit: 'USD'
  }
];

export default function RecessionIndicators() {
  const { isDark } = useTheme();
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [riskLevels, setRiskLevels] = useState({});

  // Load indicator data
  const { data: yieldCurveData, loading: yieldCurveLoading, error: yieldCurveError } = useChartData('./data/yield_curve_data.json');
  const { data: pmiData, loading: pmiLoading, error: pmiError } = useChartData('./data/pmi_data.json');
  const { data: creditSpreadsData, loading: creditSpreadsLoading, error: creditSpreadsError } = useChartData('./data/credit_spreads_data.json');
  const { data: consumerConfidenceData, loading: consumerConfidenceLoading, error: consumerConfidenceError } = useChartData('./data/consumer_confidence_data.json');
  const { data: unemploymentClaimsData, loading: unemploymentClaimsLoading, error: unemploymentClaimsError } = useChartData('./data/unemployment_claims_data.json');
  const { data: bigMacIndexData, loading: bigMacIndexLoading, error: bigMacIndexError } = useChartData('./data/big_mac_index_data.json');

  // Calculate recession risk combining all indicators with weighted scoring
  useEffect(() => {
    // Wait for at least yield curve data to be loaded
    if (!yieldCurveData?.data) {
      // Mock data while loading
      const mockRisks = {
        "North America": 45,
        "Europe": 60,
        "Asia Pacific": 35,
        "Latin America": 55,
        "Middle East": 40
      };
      setRiskLevels(mockRisks);
      return;
    }

    // Calculate risk by zone combining all indicators
    const zoneRisks = {};

    Object.entries(economicZones).forEach(([zone, { countries }]) => {
      let totalWeight = 0;
      let weightedScore = 0;

      // 1. YIELD CURVE (30% weight) - Most reliable historical predictor
      const yieldData = yieldCurveData.data.filter(d => countries.includes(d.code));
      if (yieldData.length > 0) {
        const invertedCount = yieldData.filter(d => d.inverted).length;
        const inversionRate = invertedCount / yieldData.length;
        const avgSpread = yieldData.reduce((sum, d) => sum + d.spread, 0) / yieldData.length;

        let yieldScore = 0;
        // Only consider it high risk if MOST curves are inverted (>50%)
        if (inversionRate > 0.5) {
          yieldScore += (inversionRate - 0.5) * 2 * 70; // Scale from 50% threshold
        }
        // Deeply inverted spreads are more concerning
        if (avgSpread < -0.5) {
          yieldScore += Math.min(30, Math.abs(avgSpread + 0.5) * 30);
        }

        weightedScore += yieldScore * 0.30;
        totalWeight += 0.30;
      }

      // 2. PMI MANUFACTURING (20% weight) - Strong real-time indicator
      if (pmiData?.data) {
        const pmiZoneData = pmiData.data.filter(d => countries.includes(d.code));
        if (pmiZoneData.length > 0) {
          const contractingCount = pmiZoneData.filter(d => d.value < 50).length;
          const contractionRate = contractingCount / pmiZoneData.length;
          const avgPMI = pmiZoneData.reduce((sum, d) => sum + d.value, 0) / pmiZoneData.length;

          let pmiScore = 0;
          // PMI below 50 = contraction, this is a significant signal
          if (avgPMI < 50) {
            // Scale: 50=0, 48=20, 45=50, 42=80, 40=100
            pmiScore = Math.min(100, (50 - avgPMI) * 10);
          }
          // Add weight based on how many countries are contracting
          if (contractionRate > 0.3) {
            pmiScore += contractionRate * 25;
          }

          weightedScore += Math.min(100, pmiScore) * 0.20;
          totalWeight += 0.20;
        }
      }

      // 3. CREDIT SPREADS (15% weight) - Financial stress indicator
      if (creditSpreadsData?.data) {
        const spreadZoneData = creditSpreadsData.data.filter(d => {
          const countryCode = d.code.split('_')[0];
          const countryMap = { 'US': 'USA', 'EU': 'DEU', 'UK': 'GBR', 'CN': 'CHN', 'JP': 'JPN' };
          return countries.includes(countryMap[countryCode] || countryCode);
        });

        if (spreadZoneData.length > 0) {
          const avgSpread = spreadZoneData.reduce((sum, d) => sum + d.spread, 0) / spreadZoneData.length;
          const highRiskCount = spreadZoneData.filter(d => d.risk_level === 'high').length;
          const highRiskRate = highRiskCount / spreadZoneData.length;

          let spreadScore = 0;
          // Credit spreads widening = stress
          // Scale: 150bps=20, 250bps=50, 400bps=80, 500+=100
          if (avgSpread > 100) {
            spreadScore = Math.min(100, (avgSpread - 100) / 4);
          }
          // Extra weight if high risk bonds present
          if (highRiskRate > 0.1) {
            spreadScore += highRiskRate * 40;
          }

          weightedScore += Math.min(100, spreadScore) * 0.15;
          totalWeight += 0.15;
        }
      }

      // 4. CONSUMER CONFIDENCE (15% weight) - Leading sentiment indicator
      if (consumerConfidenceData?.data) {
        const confZoneData = consumerConfidenceData.data.filter(d => countries.includes(d.code));
        if (confZoneData.length > 0) {
          const avgConfidence = confZoneData.reduce((sum, d) => sum + d.value, 0) / confZoneData.length;

          let confScore = 0;
          // Consumer confidence is relative to 100 baseline, negative = pessimism
          // Start adding risk at -10 (mild pessimism is already a warning signal)
          // Scale: 0=10, -5=15, -10=30, -15=55, -20=80, -25=100
          if (avgConfidence < 0) {
            confScore = Math.min(100, 10 + Math.abs(avgConfidence) * 3.5);
          }

          weightedScore += confScore * 0.15;
          totalWeight += 0.15;
        }
      }

      // 5. UNEMPLOYMENT CLAIMS (10% weight) - Labor market weakness
      if (unemploymentClaimsData?.data) {
        const claimsZoneData = unemploymentClaimsData.data.filter(d => countries.includes(d.code));
        if (claimsZoneData.length > 0) {
          const highRiskCount = claimsZoneData.filter(d => d.risk_level === 'high').length;
          const highRiskRate = highRiskCount / claimsZoneData.length;
          const avgStress = claimsZoneData.reduce((sum, d) => sum + Math.abs(d.change_from_baseline), 0) / claimsZoneData.length;

          let claimsScore = 0;
          // Any increase above baseline is concerning
          // Scale: 0%=0, 10%=30, 20%=60, 30%=90, 40+=100
          if (avgStress > 0) {
            claimsScore = Math.min(100, avgStress * 3);
          }
          // Add extra if many in high risk
          if (highRiskRate > 0.2) {
            claimsScore += highRiskRate * 30;
          }

          weightedScore += Math.min(100, claimsScore) * 0.10;
          totalWeight += 0.10;
        }
      }

      // 6. BIG MAC INDEX (10% weight) - Purchasing power stress
      if (bigMacIndexData?.data) {
        const bigMacZoneData = bigMacIndexData.data.filter(d => countries.includes(d.code));
        if (bigMacZoneData.length > 0) {
          const avgStress = bigMacZoneData.reduce((sum, d) => sum + d.affordability_stress, 0) / bigMacZoneData.length;

          // Scale more conservatively: 60% stress = 100 risk
          let bigMacScore = Math.min(100, (avgStress / 60) * 100);

          weightedScore += bigMacScore * 0.10;
          totalWeight += 0.10;
        }
      }

      // Normalize by total weight (in case some indicators are missing)
      // weightedScore is already in 0-100 scale, just normalize by actual weight used
      const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 30;
      zoneRisks[zone] = Math.min(100, Math.max(0, Math.round(finalScore)));
    });

    setRiskLevels(zoneRisks);
  }, [yieldCurveData, pmiData, creditSpreadsData, consumerConfidenceData, unemploymentClaimsData, bigMacIndexData]);

  const getRiskColor = (risk) => {
    if (risk >= 70) return isDark ? '#ef4444' : '#dc2626'; // High risk - red
    if (risk >= 50) return isDark ? '#f59e0b' : '#d97706'; // Medium risk - orange
    if (risk >= 30) return isDark ? '#eab308' : '#ca8a04'; // Low-medium risk - yellow
    return isDark ? '#10b981' : '#059669'; // Low risk - green
  };

  const getRiskLabel = (risk) => {
    if (risk >= 70) return 'High Risk';
    if (risk >= 50) return 'Medium-High Risk';
    if (risk >= 30) return 'Low-Medium Risk';
    return 'Low Risk';
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">
          🚨 Recession Indicators
        </h1>
        <InfoTooltip text="Monitors leading indicators across major economic zones to assess recession risk. Colors indicate combined risk levels from multiple indicators." />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
        Leading indicators tracking recession probability by economic region
      </p>

      {/* World Map - Risk Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Global Recession Risk Map</h2>
        <div className="bg-[#e8e2d6] dark:bg-gray-800 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(economicZones).map(([zone, data]) => {
              const risk = riskLevels[zone] || 0;
              const color = getRiskColor(risk);
              return (
                <div
                  key={zone}
                  className="bg-[#fffef9] dark:bg-gray-900 rounded-lg p-4 border-2 transition-all hover:scale-105"
                  style={{ borderColor: color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{zone}</h3>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: color }}
                    >
                      {risk}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {getRiskLabel(risk)}
                  </p>
                  <div className="flex flex-wrap gap-1 text-xs">
                    {data.countries.slice(0, 5).map(country => (
                      <span key={country} className="bg-[#d9d3c7] dark:bg-gray-700 px-2 py-1 rounded">
                        {country}
                      </span>
                    ))}
                    {data.countries.length > 5 && (
                      <span className="text-gray-500">+{data.countries.length - 5}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Risk Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getRiskColor(10) }}></div>
              <span className="text-sm">Low (0-30)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getRiskColor(40) }}></div>
              <span className="text-sm">Low-Medium (30-50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getRiskColor(55) }}></div>
              <span className="text-sm">Medium-High (50-70)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getRiskColor(80) }}></div>
              <span className="text-sm">High (70-100)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Selector */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Indicator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {indicators.map(indicator => (
            <button
              key={indicator.id}
              onClick={() => setSelectedIndicator(indicator.id === selectedIndicator ? null : indicator.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedIndicator === indicator.id
                  ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-[#c4bfb3] dark:border-gray-700 bg-[#fffef9] dark:bg-gray-800 hover:border-amber-500'
              }`}
            >
              <h3 className="font-semibold mb-1">{indicator.name}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{indicator.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Indicator Details */}
      {selectedIndicator && (
        <div className="bg-[#e8e2d6] dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            {indicators.find(i => i.id === selectedIndicator)?.name}
          </h2>

          {selectedIndicator === 'yield-curve' && yieldCurveData ? (
            <>
              <div className="mb-4 p-4 bg-[#fffef9] dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Countries</p>
                    <p className="text-2xl font-bold">{yieldCurveData.metadata?.total_countries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inverted Curves</p>
                    <p className="text-2xl font-bold text-red-600">{yieldCurveData.metadata?.inverted_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Normal Curves</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(yieldCurveData.metadata?.total_countries || 0) - (yieldCurveData.metadata?.inverted_count || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-semibold">{yieldCurveData.metadata?.fetched_at?.split('T')[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Warning:</strong> An inverted yield curve (negative spread) occurs when short-term yields exceed long-term yields.
                  This has historically preceded recessions within 6-24 months.
                </p>
              </div>

              <div style={{ height: Math.max(400, (yieldCurveData.data?.length || 0) * 24 + 50) + 'px' }}>
                <YieldCurveChart data={yieldCurveData.data || []} />
              </div>
            </>
          ) : selectedIndicator === 'yield-curve' && yieldCurveLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading yield curve data...</p>
            </div>
          ) : selectedIndicator === 'yield-curve' && yieldCurveError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-red-500">Error loading data: {yieldCurveError}</p>
            </div>
          ) : selectedIndicator === 'pmi' && pmiData ? (
            <>
              <div className="mb-4 p-4 bg-[#fffef9] dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Countries</p>
                    <p className="text-2xl font-bold">{pmiData.metadata?.total_countries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Contracting</p>
                    <p className="text-2xl font-bold text-red-600">{pmiData.metadata?.contracting_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Expanding</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(pmiData.metadata?.total_countries || 0) - (pmiData.metadata?.contracting_count || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-semibold">{pmiData.metadata?.fetched_at?.split('T')[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Warning:</strong> PMI below 50 indicates manufacturing sector contraction.
                  Widespread contraction across multiple countries signals potential global economic slowdown.
                </p>
              </div>

              <div style={{ height: Math.max(400, (pmiData.data?.length || 0) * 24 + 50) + 'px' }}>
                <PMIChart data={pmiData.data || []} />
              </div>
            </>
          ) : selectedIndicator === 'pmi' && pmiLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading PMI data...</p>
            </div>
          ) : selectedIndicator === 'pmi' && pmiError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-red-500">Error loading data: {pmiError}</p>
            </div>
          ) : selectedIndicator === 'credit-spread' && creditSpreadsData ? (
            <>
              <div className="mb-4 p-4 bg-[#fffef9] dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Series</p>
                    <p className="text-2xl font-bold">{creditSpreadsData.metadata?.total_series || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">High Risk (&gt;500 bps)</p>
                    <p className="text-2xl font-bold text-red-600">{creditSpreadsData.metadata?.high_risk_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Spread</p>
                    <p className="text-2xl font-bold">{creditSpreadsData.metadata?.average_spread || 0} bps</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-semibold">{creditSpreadsData.metadata?.fetched_at?.split('T')[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Warning:</strong> Credit spreads represent the additional yield investors demand for corporate vs government bonds.
                  Widening spreads above 500 bps indicate increased default risk and flight to safety.
                </p>
              </div>

              <div style={{ height: Math.max(400, (creditSpreadsData.data?.length || 0) * 24 + 50) + 'px' }}>
                <CreditSpreadsChart data={creditSpreadsData.data || []} />
              </div>
            </>
          ) : selectedIndicator === 'credit-spread' && creditSpreadsLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading credit spreads data...</p>
            </div>
          ) : selectedIndicator === 'credit-spread' && creditSpreadsError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-red-500">Error loading data: {creditSpreadsError}</p>
            </div>
          ) : selectedIndicator === 'consumer-confidence' && consumerConfidenceData ? (
            <>
              <div className="mb-4 p-4 bg-[#fffef9] dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Countries</p>
                    <p className="text-2xl font-bold">{consumerConfidenceData.metadata?.total_countries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Negative Sentiment</p>
                    <p className="text-2xl font-bold text-red-600">{consumerConfidenceData.metadata?.negative_sentiment_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
                    <p className="text-2xl font-bold">{consumerConfidenceData.metadata?.average_confidence || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-semibold">{consumerConfidenceData.metadata?.fetched_at?.split('T')[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Warning:</strong> Consumer confidence below 100 indicates pessimism about the economy.
                  Declining confidence typically precedes reduced consumer spending, which drives 60-70% of GDP.
                </p>
              </div>

              <div style={{ height: Math.max(400, (consumerConfidenceData.data?.length || 0) * 24 + 50) + 'px' }}>
                <ConsumerConfidenceChart data={consumerConfidenceData.data || []} />
              </div>
            </>
          ) : selectedIndicator === 'consumer-confidence' && consumerConfidenceLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading consumer confidence data...</p>
            </div>
          ) : selectedIndicator === 'consumer-confidence' && consumerConfidenceError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-red-500">Error loading data: {consumerConfidenceError}</p>
            </div>
          ) : selectedIndicator === 'unemployment-claims' && unemploymentClaimsData ? (
            <>
              <div className="mb-4 p-4 bg-[#fffef9] dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Countries</p>
                    <p className="text-2xl font-bold">{unemploymentClaimsData.metadata?.total_countries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">High Risk (&gt;20%)</p>
                    <p className="text-2xl font-bold text-red-600">{unemploymentClaimsData.metadata?.high_risk_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Million</p>
                    <p className="text-2xl font-bold">{unemploymentClaimsData.metadata?.average_per_million || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-semibold">{unemploymentClaimsData.metadata?.fetched_at?.split('T')[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Warning:</strong> Rising unemployment claims signal labor market weakness.
                  Sharp increases (&gt;20% from baseline) often precede recessions as businesses reduce hiring and begin layoffs.
                </p>
              </div>

              <div style={{ height: Math.max(400, (unemploymentClaimsData.data?.length || 0) * 24 + 50) + 'px' }}>
                <UnemploymentClaimsChart data={unemploymentClaimsData.data || []} />
              </div>
            </>
          ) : selectedIndicator === 'unemployment-claims' && unemploymentClaimsLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading unemployment claims data...</p>
            </div>
          ) : selectedIndicator === 'unemployment-claims' && unemploymentClaimsError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-red-500">Error loading data: {unemploymentClaimsError}</p>
            </div>
          ) : selectedIndicator === 'big-mac-index' && bigMacIndexData ? (
            <>
              <div className="mb-4 p-4 bg-[#fffef9] dark:bg-gray-900 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Countries</p>
                    <p className="text-2xl font-bold">{bigMacIndexData.metadata?.total_countries || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">High Stress (&gt;50%)</p>
                    <p className="text-2xl font-bold text-red-600">{bigMacIndexData.metadata?.high_risk_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Stress</p>
                    <p className="text-2xl font-bold">{bigMacIndexData.metadata?.average_stress || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-semibold">{bigMacIndexData.metadata?.fetched_at?.split('T')[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>⚠️ Warning:</strong> The Big Mac Index measures purchasing power parity.
                  High affordability stress (&gt;50% valuation gap) indicates reduced purchasing power and economic pressure on consumers.
                </p>
              </div>

              <div style={{ height: Math.max(400, (bigMacIndexData.data?.length || 0) * 24 + 50) + 'px' }}>
                <BigMacIndexChart data={bigMacIndexData.data || []} />
              </div>
            </>
          ) : selectedIndicator === 'big-mac-index' && bigMacIndexLoading ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-500">Loading Big Mac Index data...</p>
            </div>
          ) : selectedIndicator === 'big-mac-index' && bigMacIndexError ? (
            <div className="h-96 flex items-center justify-center">
              <p className="text-red-500">Error loading data: {bigMacIndexError}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Methodology Note */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-300">📝 Recession Risk Scoring Methodology</h3>

        <p className="text-sm text-blue-800 dark:text-blue-400 mb-4">
          The recession risk score (0-100) combines six leading economic indicators using a weighted average system.
          Each indicator is normalized to a 0-100 scale based on historical recession thresholds, then combined using these weights:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Yield Curve (10Y-2Y)</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">30%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Most reliable historical predictor. Inversions preceded all recessions since 1955.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">PMI Manufacturing</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">20%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Strong real-time indicator. Values below 50 signal manufacturing contraction.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Credit Spreads</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">15%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Financial stress indicator. Widening spreads (&gt;500 bps) signal credit market stress.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Consumer Confidence</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">15%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Leading sentiment indicator. Below 100 indicates economic pessimism.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Unemployment Claims</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">10%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Labor market weakness signal. Sharp increases (&gt;20%) often precede recessions.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Big Mac Index</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">10%</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Purchasing power stress. High affordability gaps (&gt;50%) indicate economic strain.</p>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-600">
          <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
            <strong>Calculation Example:</strong> If a zone has Yield Curve score of 60, PMI of 75, Credit Spreads of 40,
            Consumer Confidence of 55, Unemployment of 30, and Big Mac of 25:
          </p>
          <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
            Risk = (60×0.30) + (75×0.20) + (40×0.15) + (55×0.15) + (30×0.10) + (25×0.10) = <strong className="text-blue-600 dark:text-blue-400">54.25</strong>
          </p>
        </div>

        <p className="text-xs text-blue-700 dark:text-blue-500 mt-3">
          <strong>Interpretation:</strong> Risk scores 0-40 = Low, 40-70 = Moderate, 70+ = High probability of recession within 12 months based on historical patterns.
        </p>
      </div>
    </div>
  );
}
