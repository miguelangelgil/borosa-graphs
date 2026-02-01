# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Policy

**All code, comments, UI text, commit messages, and documentation must be written in English**, regardless of the language used in user requests. This ensures the project remains accessible to a global audience.

## Project Overview

Static web visualization dashboard for financial metrics not available on TradingView. Hosted on GitHub Pages with weekly automated data updates via GitHub Actions.

## Architecture

### Frontend (Single Page App)
- **index.html**: Main SPA with sidebar navigation and multiple metric pages
- **js/theme.js**: Light/dark mode toggle with localStorage persistence
- **js/chart-utils.js**: Shared Chart.js configuration factory (`createChartModule`)
- **js/navigation.js**: Page routing and module loading
- **js/{metric}.js**: Individual metric modules (debt-gdp, gdp, debt, m2, exports, employment)

### Data Pipeline
- **scripts/country_mappings.py**: Shared country name mappings (English) and region classifications
- **scripts/fetch_*.py**: Individual data fetchers for each metric
- **data/*.json**: Generated JSON files with standardized structure

### Data Sources
| Metric | Source | Indicator |
|--------|--------|-----------|
| Debt/GDP | IMF DataMapper | GGXWDG_NGDP |
| GDP | IMF DataMapper | NGDPD |
| Public Debt | IMF DataMapper | GGXWDG |
| M2 | World Bank | FM.LBL.BMNY.GD.ZS + NY.GDP.MKTP.CD |
| Trade Balance | World Bank | NE.EXP.GNFS.CD - NE.IMP.GNFS.CD |
| Unemployment | IMF DataMapper | LUR |
| Bond Yields | Investing.com | Government bonds (1Y-30Y) |
| Yield Curve | Calculated | 10Y-2Y spread from bonds |
| PMI Manufacturing | OECD/S&P (mock) | Manufacturing PMI index |
| Credit Spreads | Calculated | Corporate vs government bond spreads |
| Consumer Confidence | OECD/Conference Board (mock) | Consumer confidence index |
| Unemployment Claims | OECD/National agencies (mock) | Initial jobless claims |
| Big Mac Index | The Economist GitHub | Purchasing power parity indicator |
| Gold Heat Maps | Yahoo Finance + Synthetic | Gold futures prices & options positioning |

## Commands

### Fetch All Data Locally
```bash
cd scripts
pip install requests investpy yfinance
python fetch_imf_data.py      # Debt/GDP ratio
python fetch_gdp_data.py      # GDP
python fetch_debt_data.py     # Public debt
python fetch_m2_data.py       # M2 money supply
python fetch_trade_data.py    # Trade balance
python fetch_employment_data.py  # Unemployment
python fetch_bonds_data.py    # Bond yields
python fetch_corporate_bonds_data.py  # Corporate bonds
python fetch_yield_curve.py   # Yield curve spread (requires bonds data)
python fetch_pmi_data.py       # PMI Manufacturing
python fetch_credit_spreads.py  # Credit spreads (requires bonds & corporate bonds)
python fetch_consumer_confidence.py  # Consumer confidence
python fetch_unemployment_claims.py  # Unemployment claims
python fetch_big_mac_index.py  # Big Mac Index
python fetch_gold_heatmap_data.py  # Gold futures & options heat maps
```

### Local Development
```bash
python -m http.server 8000
```

## Adding New Metrics

1. Create `scripts/fetch_{metric}_data.py` using existing fetchers as template
2. Add data file to `data/{metric}_data.json`
3. Create `js/{metric}.js` with `createChartModule()` configuration
4. Add HTML section in `index.html` following existing pattern (prefix IDs with metric name)
5. Add sidebar link with `data-page="{metric}"`
6. Add fetch step to `.github/workflows/update-data.yml`

## Data JSON Structure

All data files follow this structure:
```json
{
  "metadata": { "source", "indicator", "fetched_at", "available_years", "last_real_year", "projection_years" },
  "data": { "2024": [{ "code", "country", "value", "region", "isProjection" }] },
  "timeseries": { "USA": { "country", "region", "data": [{ "year", "value", "isProjection" }] } }
}
```

Note: Debt/GDP uses `debt` key instead of `value` for historical reasons.
