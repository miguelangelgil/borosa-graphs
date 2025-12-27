import MetricPage from '../components/MetricPage';

export default function Gdp() {
  return (
    <MetricPage
      dataFile="./data/gdp_data.json"
      valueKey="value"
      valueLabel="GDP"
      valueUnit="$"
      titleBar="💰 Gross Domestic Product (GDP)"
      titleLine="📈 GDP Evolution - Time Series"
    />
  );
}
