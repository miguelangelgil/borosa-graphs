"""
Nasdaq 100 Futures and Options Volume Data Fetcher
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Nasdaq 100 configuration
config = {
    'instrument_name': 'Nasdaq 100',
    'futures_symbol': 'NQ=F',  # E-mini Nasdaq 100 Futures
    'etf_symbol': 'QQQ',  # Invesco QQQ Trust
    'cftc_code': '209742',  # Nasdaq 100 - Chicago Mercantile Exchange
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "nasdaq_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "nasdaq_heatmap_history.json"),
    'price_unit': 'USD (index points)',
    'scale_factor': 40  # QQQ is ~1/40 of Nasdaq 100 futures
}

if __name__ == "__main__":
    fetch_instrument_data(config)
