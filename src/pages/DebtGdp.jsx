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
      refLines={[
        { value: 60, color: '#22c55e' },
        { value: 100, color: '#fbbf24' }
      ]}
    />
  );
}
