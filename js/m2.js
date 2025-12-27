// M2 Money Supply module
const m2Module = createChartModule({
  prefix: 'm2',
  dataFile: './data/m2_data.json',
  valueKey: 'value',
  valueLabel: 'M2',
  valueUnit: ' USD',
  titleBar: '🏦 M2 Money Supply',
  titleLine: '📈 M2 Evolution - Time Series',
  refLines: []
});

registerPageModule('m2', m2Module);
