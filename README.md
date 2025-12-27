# Borosa Graphs

A static web dashboard for visualizing financial metrics that aren't available on TradingView. Hosted on GitHub Pages with automated weekly data updates.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Data Update](https://img.shields.io/badge/data-weekly%20updates-green.svg)

## Features

- **Debt/GDP Ratio** - Sovereign debt as percentage of GDP by country
- **GDP** - Gross Domestic Product in USD
- **Public Debt** - Total government debt in USD
- **M2 Money Supply** - Broad money supply including World total
- **Trade Balance** - Exports minus imports
- **Unemployment** - Unemployment rate by country
- **Bond Yields** - Government bond yields with duration selector (1Y to 30Y)

Each metric includes:
- Interactive bar chart rankings by country
- Time series evolution charts
- Region filtering (Asia, Europe, Americas, Latam, MENA, Africa, Oceania)
- Real data vs projections distinction
- Light/dark theme toggle

## Data Sources

| Metric | Source | Update Frequency |
|--------|--------|------------------|
| Debt/GDP, GDP, Public Debt, Unemployment | [IMF DataMapper](https://www.imf.org/external/datamapper) | Weekly |
| M2 Money Supply, Trade Balance | [World Bank API](https://data.worldbank.org/) | Weekly |
| Bond Yields | [Investing.com](https://www.investing.com/rates-bonds/) | Weekly |

## Live Demo

Visit: [https://miguelangelgil.github.io/borosa-graphs](https://miguelangelgil.github.io/borosa-graphs)

## Local Development

### Prerequisites
- Python 3.x
- `requests` library

### Setup

```bash
# Clone the repository
git clone https://github.com/miguelangelgil/borosa-graphs.git
cd borosa-graphs

# Install Python dependencies
pip install requests investpy

# Fetch fresh data
cd scripts
python fetch_imf_data.py      # Debt/GDP ratio
python fetch_gdp_data.py      # GDP
python fetch_debt_data.py     # Public debt
python fetch_m2_data.py       # M2 money supply
python fetch_trade_data.py    # Trade balance
python fetch_employment_data.py  # Unemployment
python fetch_bonds_data.py    # Bond yields

# Start local server
cd ..
python -m http.server 8000
```

Open http://localhost:8000 in your browser.

## Project Structure

```
borosa-graphs/
├── index.html              # Main SPA
├── js/
│   ├── theme.js            # Light/dark mode toggle
│   ├── chart-utils.js      # Shared Chart.js configuration
│   ├── navigation.js       # Page routing
│   └── {metric}.js         # Individual metric modules
├── scripts/
│   ├── country_mappings.py # Country names and region classifications
│   └── fetch_*.py          # Data fetchers for each metric
├── data/
│   └── *.json              # Generated data files
└── .github/
    └── workflows/
        └── update-data.yml # Automated weekly data updates
```

## Data Format

All JSON data files follow this structure:

```json
{
  "metadata": {
    "source": "IMF DataMapper",
    "indicator": "GGXWDG_NGDP",
    "fetched_at": "2024-12-25T10:00:00",
    "available_years": ["2024", "2023", ...],
    "last_real_year": "2025",
    "projection_years": ["2026", "2027", ...]
  },
  "data": {
    "2024": [
      { "code": "USA", "country": "USA", "value": 123456, "region": "Americas", "isProjection": false }
    ]
  },
  "timeseries": {
    "USA": {
      "country": "USA",
      "region": "Americas",
      "data": [
        { "year": "2020", "value": 100000, "isProjection": false }
      ]
    }
  }
}
```

## Adding a New Metric

1. Create `scripts/fetch_{metric}_data.py` using existing fetchers as template
2. Add output to `data/{metric}_data.json`
3. Create `js/{metric}.js` with `createChartModule()` configuration
4. Add HTML section in `index.html` (prefix all IDs with metric name)
5. Add sidebar link with `data-page="{metric}"`
6. Add fetch step to `.github/workflows/update-data.yml`

## Technologies

- **Frontend**: Vanilla JavaScript, [Tailwind CSS](https://tailwindcss.com/), [Chart.js](https://www.chartjs.org/)
- **Data Pipeline**: Python with `requests` and `investpy` libraries
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## Contributing

Contributions are welcome! Feel free to:
- Report bugs or suggest features via [Issues](https://github.com/miguelangelgil/borosa-graphs/issues)
- Submit pull requests with improvements
- Add new financial metrics

## License

MIT License - feel free to use this project for any purpose.

---

*Data provided by IMF, World Bank, and Investing.com.*
