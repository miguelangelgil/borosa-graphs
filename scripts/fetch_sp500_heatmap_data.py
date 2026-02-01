"""
S&P 500 Futures and Options Volume Data Fetcher
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# S&P 500 configuration
config = {
    'instrument_name': 'S&P 500',
    'futures_symbol': 'ES=F',  # E-mini S&P 500 Futures
    'etf_symbol': 'SPY',  # SPDR S&P 500 ETF Trust
    'cftc_code': '13874+',  # S&P 500 Consolidated - Chicago Mercantile Exchange
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "sp500_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "sp500_heatmap_history.json"),
    'price_unit': 'USD (index points)',
    'scale_factor': 10  # SPY is ~1/10 of S&P 500 futures
}

if __name__ == "__main__":
    fetch_instrument_data(config)
