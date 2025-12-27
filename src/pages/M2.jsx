import MetricPage from '../components/MetricPage';

export default function M2() {
  return (
    <MetricPage
      dataFile="./data/m2_data.json"
      valueKey="value"
      valueLabel="M2"
      valueUnit="$"
      titleBar="🏦 M2 Money Supply"
      titleLine="📈 M2 Evolution - Time Series"
    />
  );
}
