// M2 Money Supply module
const m2Module = createChartModule({
  prefix: 'm2',
  dataFile: './data/m2_data.json',
  valueKey: 'value',
  valueLabel: 'M2',
  valueUnit: ' USD',
  titleBar: '🏦 Oferta Monetaria M2',
  titleLine: '📈 Evolución de M2 - Series Temporales',
  refLines: []
});

registerPageModule('m2', m2Module);
