import MetricPage from '../components/MetricPage';

export default function DebtGdp() {
  return (
    <MetricPage
      dataFile="./data/imf_debt_data.json"
      valueKey="debt"
      valueLabel="Debt/GDP"
      valueUnit="%"
      titleBar="📊 Sovereign Debt / GDP Ratio"
      titleLine="📈 Debt/GDP Evolution - Time Series"
      infoBar="Shows the ratio of government debt to GDP for each country in the selected year. The green line marks 60% (Maastricht criterion) and yellow marks 100%."
      infoLine="Shows how the debt-to-GDP ratio has evolved over time for selected countries. Dashed lines indicate IMF projections."
      refLines={[
        { value: 60, color: '#22c55e' },
        { value: 100, color: '#fbbf24' }
      ]}
    />
  );
}
