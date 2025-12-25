// Employment module
const employmentModule = createChartModule({
  prefix: 'employment',
  dataFile: './data/employment_data.json',
  valueKey: 'value',
  valueLabel: 'Desempleo',
  valueUnit: '%',
  titleBar: '👷 Tasa de Desempleo',
  titleLine: '📈 Evolución del Desempleo - Series Temporales',
  refLines: []
});

registerPageModule('employment', employmentModule);
