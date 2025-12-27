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
      infoBar="Shows the unemployment rate (percentage of labor force) for each country in the selected year."
      infoLine="Shows how unemployment rates have evolved over time for selected countries. Dashed lines indicate IMF projections."
    />
  );
}
