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
      infoBar="Shows the M2 money supply (in US dollars) for each country. M2 includes cash, checking deposits, and easily convertible near money."
      infoLine="Shows how M2 money supply has evolved over time for selected countries."
    />
  );
}
