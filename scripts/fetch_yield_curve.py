#!/usr/bin/env python3
"""
Calculate Yield Curve Spread (10Y-2Y) from existing bond data.
A negative spread (inverted yield curve) historically precedes recessions.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def load_bonds_data():
    """Load existing bonds data."""
    bonds_file = Path(__file__).parent.parent / 'data' / 'bonds_data.json'

    if not bonds_file.exists():
        print(f"Error: {bonds_file} not found. Run fetch_bonds_data.py first.", file=sys.stderr)
        sys.exit(1)

    with open(bonds_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def calculate_yield_curve_spreads(bonds_data):
    """Calculate 10Y-2Y spread for each country."""

    # Check if we have the required durations
    available_durations = bonds_data.get('metadata', {}).get('available_durations', [])

    if '10Y' not in available_durations or '2Y' not in available_durations:
        print("Error: 10Y and 2Y data required for yield curve calculation", file=sys.stderr)
        print(f"Available durations: {available_durations}", file=sys.stderr)
        sys.exit(1)

    # Get current data for 10Y and 2Y
    data_10y = bonds_data.get('data', {}).get('10Y', [])
    data_2y = bonds_data.get('data', {}).get('2Y', [])

    # Create lookup for 2Y yields
    yields_2y = {item['code']: item['value'] for item in data_2y}

    # Calculate spreads
    spreads = []
    for item in data_10y:
        code = item['code']
        if code in yields_2y:
            spread = item['value'] - yields_2y[code]
            spreads.append({
                'code': code,
                'country': item['country'],
                'region': item['region'],
                'spread': round(spread, 2),
                'yield_10y': item['value'],
                'yield_2y': yields_2y[code],
                'inverted': spread < 0
            })

    return spreads

def build_output_structure(spreads, bonds_metadata):
    """Build the output JSON structure."""

    # Current snapshot sorted by spread
    current_data = sorted(spreads, key=lambda x: x['spread'])

    # Build timeseries (for now, just current data point)
    # TODO: Add historical data when available
    timeseries = {}
    for item in spreads:
        timeseries[item['code']] = {
            'country': item['country'],
            'region': item['region'],
            'data': [{
                'date': datetime.now().strftime('%Y-%m-%d'),
                'spread': item['spread'],
                'yield_10y': item['yield_10y'],
                'yield_2y': item['yield_2y'],
                'inverted': item['inverted']
            }]
        }

    output = {
        'metadata': {
            'source': 'Calculated from bonds_data.json',
            'indicator': 'Yield Curve Spread (10Y-2Y)',
            'description': 'Difference between 10-year and 2-year government bond yields. Negative values (inverted curve) historically precede recessions.',
            'unit': 'basis points (bps)',
            'fetched_at': datetime.now().isoformat(),
            'warning_threshold': 0,  # Inversion (< 0) is warning signal
            'total_countries': len(spreads),
            'inverted_count': sum(1 for s in spreads if s['inverted'])
        },
        'data': current_data,
        'timeseries': timeseries
    }

    return output

def main():
    print("Loading bonds data...")
    bonds_data = load_bonds_data()

    print("Calculating yield curve spreads...")
    spreads = calculate_yield_curve_spreads(bonds_data)

    print(f"Calculated spreads for {len(spreads)} countries")
    inverted = sum(1 for s in spreads if s['inverted'])
    print(f"Inverted yield curves: {inverted}/{len(spreads)} countries")

    output = build_output_structure(spreads, bonds_data.get('metadata', {}))

    # Save to file
    output_file = Path(__file__).parent.parent / 'data' / 'yield_curve_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Yield curve data saved to {output_file}")

    # Print summary
    print("\n" + "="*60)
    print("YIELD CURVE SUMMARY")
    print("="*60)
    print(f"Total countries: {len(spreads)}")
    print(f"Inverted curves: {inverted} ({inverted/len(spreads)*100:.1f}%)")
    print(f"\nMost inverted:")
    for item in sorted(spreads, key=lambda x: x['spread'])[:5]:
        status = "[!] INVERTED" if item['inverted'] else "[OK] Normal"
        print(f"  {item['country']:20} {item['spread']:6.2f} bps  {status}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
