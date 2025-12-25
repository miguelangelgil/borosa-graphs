// Debt module
const debtModule = createChartModule({
  prefix: 'debt',
  dataFile: './data/debt_data.json',
  valueKey: 'value',
  valueLabel: 'Deuda',
  valueUnit: ' USD',
  titleBar: '💳 Deuda Pública Total',
  titleLine: '📈 Evolución de la Deuda - Series Temporales',
  refLines: []
});

registerPageModule('debt', debtModule);
