import MetricPage from '../components/MetricPage';

export default function Trade() {
  return (
    <MetricPage
      dataFile="./data/trade_data.json"
      valueKey="value"
      valueLabel="Trade Balance"
      valueUnit="$"
      titleBar="⚖️ Trade Balance"
      titleLine="📈 Trade Balance Evolution - Time Series"
    />
  );
}
