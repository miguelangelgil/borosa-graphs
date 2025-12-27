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
      infoBar="Shows the trade balance (exports minus imports, in US dollars) for each country. Positive values indicate a trade surplus, negative values a deficit."
      infoLine="Shows how the trade balance has evolved over time for selected countries."
    />
  );
}
