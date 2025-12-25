// GDP module
const gdpModule = createChartModule({
  prefix: 'gdp',
  dataFile: './data/gdp_data.json',
  valueKey: 'value',
  valueLabel: 'PIB',
  valueUnit: ' USD',
  titleBar: '💰 PIB (Producto Interior Bruto)',
  titleLine: '📈 Evolución del PIB - Series Temporales',
  refLines: []
});

registerPageModule('gdp', gdpModule);
