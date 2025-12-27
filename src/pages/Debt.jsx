import MetricPage from '../components/MetricPage';

export default function Debt() {
  return (
    <MetricPage
      dataFile="./data/debt_data.json"
      valueKey="value"
      valueLabel="Public Debt"
      valueUnit="$"
      titleBar="💳 Public Debt"
      titleLine="📈 Public Debt Evolution - Time Series"
    />
  );
}
