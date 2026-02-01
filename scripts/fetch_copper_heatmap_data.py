"""
Copper Futures and Options Volume Data Fetcher
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Copper configuration
config = {
    'instrument_name': 'Copper',
    'futures_symbol': 'HG=F',  # Copper Futures
    'etf_symbol': 'CPER',  # United States Copper Index Fund
    'cftc_code': '085692',  # Copper - Commodity Exchange Inc.
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "copper_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "copper_heatmap_history.json"),
    'price_unit': 'USD per pound (futures) / USD per share (CPER ETF)',
    'scale_factor': 1
}

if __name__ == "__main__":
    fetch_instrument_data(config)
