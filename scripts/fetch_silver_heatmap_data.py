"""
Silver Futures and Options Volume Data Fetcher
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Silver configuration
config = {
    'instrument_name': 'Silver',
    'futures_symbol': 'SI=F',  # Silver Futures
    'etf_symbol': 'SLV',  # iShares Silver Trust
    'cftc_code': '084691',  # Silver - Commodity Exchange Inc.
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "silver_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "silver_heatmap_history.json"),
    'price_unit': 'USD per troy ounce (futures) / USD per share (SLV ETF)',
    'scale_factor': 1  # SLV tracks silver price more directly
}

if __name__ == "__main__":
    fetch_instrument_data(config)
