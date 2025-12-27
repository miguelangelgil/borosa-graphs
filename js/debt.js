// Debt module
const debtModule = createChartModule({
  prefix: 'debt',
  dataFile: './data/debt_data.json',
  valueKey: 'value',
  valueLabel: 'Debt',
  valueUnit: ' USD',
  titleBar: '💳 Total Public Debt',
  titleLine: '📈 Debt Evolution - Time Series',
  refLines: []
});

registerPageModule('debt', debtModule);
