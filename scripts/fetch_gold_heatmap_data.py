"""
Gold Futures and Options Volume Data Fetcher
"""

import os
import sys

# Add parent directory to path to import generic fetcher
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Gold configuration
config = {
    'instrument_name': 'Gold',
    'futures_symbol': 'GC=F',  # Gold Futures
    'etf_symbol': 'GLD',  # SPDR Gold Shares
    'cftc_code': '088691',  # Gold - Commodity Exchange Inc.
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "gold_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "gold_heatmap_history.json"),
    'price_unit': 'USD per troy ounce (futures) / USD per share (GLD ETF)',
    'scale_factor': 10  # GLD represents ~1/10 oz of gold
}

if __name__ == "__main__":
    fetch_instrument_data(config)
