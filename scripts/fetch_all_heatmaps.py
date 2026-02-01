"""
Fetch all heatmap data for all instruments
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_generic_heatmap import fetch_instrument_data

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# All instruments configuration
instruments = [
    {
        'instrument_name': 'Gold',
        'futures_symbol': 'GC=F',
        'etf_symbol': 'GLD',
        'cftc_code': '088691',
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "gold_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "gold_heatmap_history.json"),
        'price_unit': 'USD per troy ounce (futures) / USD per share (GLD ETF)',
        'scale_factor': 10
    },
    {
        'instrument_name': 'Silver',
        'futures_symbol': 'SI=F',
        'etf_symbol': 'SLV',
        'cftc_code': '084691',
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "silver_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "silver_heatmap_history.json"),
        'price_unit': 'USD per troy ounce (futures) / USD per share (SLV ETF)',
        'scale_factor': 1
    },
    {
        'instrument_name': 'Copper',
        'futures_symbol': 'HG=F',
        'etf_symbol': 'CPER',
        'cftc_code': '085692',
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "copper_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "copper_heatmap_history.json"),
        'price_unit': 'USD per pound (futures) / USD per share (CPER ETF)',
        'scale_factor': 1
    },
    {
        'instrument_name': 'S&P 500',
        'futures_symbol': 'ES=F',
        'etf_symbol': 'SPY',
        'cftc_code': '13874+',
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "sp500_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "sp500_heatmap_history.json"),
        'price_unit': 'USD (index points)',
        'scale_factor': 10  # SPY is ~1/10 of S&P 500 futures
    },
    {
        'instrument_name': 'Nasdaq 100',
        'futures_symbol': 'NQ=F',
        'etf_symbol': 'QQQ',
        'cftc_code': '209742',
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "nasdaq_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "nasdaq_heatmap_history.json"),
        'price_unit': 'USD (index points)',
        'scale_factor': 40  # QQQ is ~1/40 of Nasdaq 100 futures
    },
    {
        'instrument_name': 'Nikkei 225',
        'futures_symbol': '^N225',
        'etf_symbol': 'EWJ',
        'cftc_code': None,
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "nikkei_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "nikkei_heatmap_history.json"),
        'price_unit': 'JPY (index points) / USD per share (EWJ ETF)',
        'scale_factor': 622  # EWJ is ~1/622 of Nikkei 225
    },
    {
        'instrument_name': 'DAX',
        'futures_symbol': '^GDAXI',
        'etf_symbol': 'EWG',
        'cftc_code': None,
        'output_file': os.path.join(SCRIPT_DIR, "..", "data", "dax_heatmap_data.json"),
        'history_file': os.path.join(SCRIPT_DIR, "..", "data", "dax_heatmap_history.json"),
        'price_unit': 'EUR (index points) / USD per share (EWG ETF)',
        'scale_factor': 569  # EWG is ~1/569 of DAX
    }
]

if __name__ == "__main__":
    print("=" * 80)
    print("FETCHING ALL INSTRUMENTS HEATMAP DATA")
    print("=" * 80)

    success_count = 0
    failed = []

    for config in instruments:
        print(f"\n{'=' * 80}")
        print(f"Fetching {config['instrument_name']}...")
        print(f"{'=' * 80}")

        if fetch_instrument_data(config):
            success_count += 1
            print(f"✓ {config['instrument_name']} completed successfully")
        else:
            failed.append(config['instrument_name'])
            print(f"✗ {config['instrument_name']} failed")

    print(f"\n{'=' * 80}")
    print(f"SUMMARY")
    print(f"{'=' * 80}")
    print(f"Successfully fetched: {success_count}/{len(instruments)}")

    if failed:
        print(f"Failed: {', '.join(failed)}")
    else:
        print("All instruments fetched successfully!")
