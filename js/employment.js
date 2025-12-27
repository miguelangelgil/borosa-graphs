// Employment module
const employmentModule = createChartModule({
  prefix: 'employment',
  dataFile: './data/employment_data.json',
  valueKey: 'value',
  valueLabel: 'Unemployment',
  valueUnit: '%',
  titleBar: '👷 Unemployment Rate',
  titleLine: '📈 Unemployment Evolution - Time Series',
  refLines: []
});

registerPageModule('employment', employmentModule);
