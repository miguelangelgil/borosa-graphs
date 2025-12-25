// Exports module
const exportsModule = createChartModule({
  prefix: 'exports',
  dataFile: './data/exports_data.json',
  valueKey: 'value',
  valueLabel: 'Exportaciones',
  valueUnit: ' USD',
  titleBar: '🚢 Volumen de Exportaciones',
  titleLine: '📈 Evolución de Exportaciones - Series Temporales',
  refLines: []
});

registerPageModule('exports', exportsModule);
