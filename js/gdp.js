// GDP module
const gdpModule = createChartModule({
  prefix: 'gdp',
  dataFile: './data/gdp_data.json',
  valueKey: 'value',
  valueLabel: 'GDP',
  valueUnit: ' USD',
  titleBar: '💰 GDP (Gross Domestic Product)',
  titleLine: '📈 GDP Evolution - Time Series',
  refLines: []
});

registerPageModule('gdp', gdpModule);
