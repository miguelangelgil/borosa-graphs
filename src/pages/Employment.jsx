import MetricPage from '../components/MetricPage';

export default function Employment() {
  return (
    <MetricPage
      dataFile="./data/employment_data.json"
      valueKey="value"
      valueLabel="Unemployment Rate"
      valueUnit="%"
      titleBar="👷 Unemployment Rate"
      titleLine="📈 Unemployment Evolution - Time Series"
    />
  );
}
