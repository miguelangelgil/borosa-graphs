"""
DAX Futures and Options Volume Data Fetcher
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# DAX configuration
config = {
    'instrument_name': 'DAX',
    'futures_symbol': '^GDAXI',  # DAX Index (futures data limited)
    'etf_symbol': 'EWG',  # iShares MSCI Germany ETF
    'cftc_code': None,  # No CFTC data for DAX
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "dax_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "dax_heatmap_history.json"),
    'price_unit': 'EUR (index points) / USD per share (EWG ETF)',
    'scale_factor': 569  # EWG is ~1/569 of DAX
}

if __name__ == "__main__":
    fetch_instrument_data(config)
