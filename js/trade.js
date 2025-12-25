// Trade Balance module
const tradeModule = createChartModule({
  prefix: 'trade',
  dataFile: './data/trade_data.json',
  valueKey: 'value',
  valueLabel: 'Balanza',
  valueUnit: ' USD',
  titleBar: '⚖️ Balanza Comercial',
  titleLine: '📈 Evolución Balanza Comercial - Series Temporales',
  refLines: [
    { value: 0, color: '#6b7280' }  // Grey line at zero
  ]
});

registerPageModule('trade', tradeModule);
