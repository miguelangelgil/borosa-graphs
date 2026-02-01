"""
Nikkei 225 Futures and Options Volume Data Fetcher
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Nikkei 225 configuration
config = {
    'instrument_name': 'Nikkei 225',
    'futures_symbol': '^N225',  # Nikkei 225 Index (futures data limited)
    'etf_symbol': 'EWJ',  # iShares MSCI Japan ETF
    'cftc_code': None,  # No CFTC data for Nikkei
    'output_file': os.path.join(SCRIPT_DIR, "..", "data", "nikkei_heatmap_data.json"),
    'history_file': os.path.join(SCRIPT_DIR, "..", "data", "nikkei_heatmap_history.json"),
    'price_unit': 'JPY (index points) / USD per share (EWJ ETF)',
    'scale_factor': 622  # EWJ is ~1/622 of Nikkei 225
}

if __name__ == "__main__":
    fetch_instrument_data(config)
