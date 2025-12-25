// Debt/GDP ratio module
const debtGdpModule = createChartModule({
  prefix: 'debtgdp',
  dataFile: './data/imf_debt_data.json',
  valueKey: 'debt',
  valueLabel: 'Deuda/PIB',
  valueUnit: '%',
  titleBar: '📊 Ratio Deuda Soberana / PIB',
  titleLine: '📈 Evolución Deuda/PIB - Series Temporales',
  refLines: [
    { value: 60, color: '#22c55e' },
    { value: 100, color: '#fbbf24' }
  ]
});

registerPageModule('debt-gdp', debtGdpModule);
