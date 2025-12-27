// Trade Balance module
const tradeModule = createChartModule({
  prefix: 'trade',
  dataFile: './data/trade_data.json',
  valueKey: 'value',
  valueLabel: 'Balance',
  valueUnit: ' USD',
  titleBar: '⚖️ Trade Balance',
  titleLine: '📈 Trade Balance Evolution - Time Series',
  refLines: [
    { value: 0, color: '#6b7280' }  // Grey line at zero
  ]
});

registerPageModule('trade', tradeModule);
