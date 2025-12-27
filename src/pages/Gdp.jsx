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
      infoBar="Shows the nominal GDP (in US dollars) for each country in the selected year. GDP measures the total value of goods and services produced."
      infoLine="Shows how GDP has evolved over time for selected countries. Dashed lines indicate IMF projections."
    />
  );
}
