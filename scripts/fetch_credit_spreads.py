#!/usr/bin/env python3
"""
Calculate Credit Spreads from existing corporate bonds and government bonds data.
Credit spread = Corporate bond yield - Government bond yield
Widening spreads indicate increased credit risk and potential recession.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

def load_bonds_data():
    """Load existing government bonds data."""
    bonds_file = Path(__file__).parent.parent / 'data' / 'bonds_data.json'

    if not bonds_file.exists():
        print(f"Error: {bonds_file} not found. Run fetch_bonds_data.py first.", file=sys.stderr)
        sys.exit(1)

    with open(bonds_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_corporate_bonds_data():
    """Load existing corporate bonds data."""
    corp_bonds_file = Path(__file__).parent.parent / 'data' / 'corporate_bonds_data.json'

    if not corp_bonds_file.exists():
        print(f"Error: {corp_bonds_file} not found. Run fetch_corporate_bonds_data.py first.", file=sys.stderr)
        sys.exit(1)

    with open(corp_bonds_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def calculate_credit_spreads(bonds_data, corp_bonds_data):
    """Calculate credit spreads by comparing corporate and government bonds."""

    # Get 10Y government bond yields
    gov_yields_10y = {}
    if '10Y' in bonds_data.get('data', {}):
        for item in bonds_data['data']['10Y']:
            gov_yields_10y[item['code']] = item['value']

    # Map regions from corporate bonds
    region_map = {}
    if 'current' in corp_bonds_data:
        for category_data in corp_bonds_data['current'].values():
            for item in category_data:
                # Extract country code from series code (e.g., "US_IG" -> "USA")
                code_parts = item['code'].split('_')
                if code_parts:
                    region_code = code_parts[0]
                    region_map[region_code] = {
                        'name': item['name'],
                        'region': item['region']
                    }

    spreads = []

    # Calculate spreads for Investment Grade and High Yield
    if 'current' in corp_bonds_data:
        for category, items in corp_bonds_data['current'].items():
            for item in items:
                code_parts = item['code'].split('_')
                if not code_parts:
                    continue

                region_code = code_parts[0]
                # Map common region codes to country codes
                country_code_map = {
                    'US': 'USA',
                    'EU': 'DEU',  # Use Germany as EU proxy
                    'UK': 'GBR',
                    'CN': 'CHN',
                    'JP': 'JPN'
                }

                country_code = country_code_map.get(region_code, region_code)

                if country_code not in gov_yields_10y:
                    continue

                spread = item['value'] - gov_yields_10y[country_code]
                spreads.append({
                    'code': item['code'],
                    'name': item['name'],
                    'region': item['region'],
                    'category': category,
                    'spread': round(spread * 100, 2),  # Convert to basis points
                    'corp_yield': item['value'],
                    'gov_yield': gov_yields_10y[country_code],
                    'risk_level': 'high' if spread > 5 else 'medium' if spread > 3 else 'low'
                })

    return spreads

def build_output_structure(spreads):
    """Build the output JSON structure."""

    # Sort by spread (widest first)
    current_data = sorted(spreads, key=lambda x: x['spread'], reverse=True)

    # Build timeseries
    timeseries = {}
    for item in spreads:
        timeseries[item['code']] = {
            'name': item['name'],
            'region': item['region'],
            'category': item['category'],
            'data': [{
                'date': datetime.now().strftime('%Y-%m-%d'),
                'spread': item['spread'],
                'corp_yield': item['corp_yield'],
                'gov_yield': item['gov_yield']
            }]
        }

    high_risk = sum(1 for s in spreads if s['risk_level'] == 'high')
    avg_spread = sum(s['spread'] for s in spreads) / len(spreads) if spreads else 0

    output = {
        'metadata': {
            'source': 'Calculated from corporate_bonds_data.json and bonds_data.json',
            'indicator': 'Credit Spreads',
            'description': 'Difference between corporate and government bond yields. Widening spreads indicate increased credit risk and potential recession.',
            'unit': 'basis points (bps)',
            'fetched_at': datetime.now().isoformat(),
            'warning_threshold': 500,  # 5% spread
            'total_series': len(spreads),
            'high_risk_count': high_risk,
            'average_spread': round(avg_spread, 2)
        },
        'data': current_data,
        'timeseries': timeseries
    }

    return output

def main():
    print("Loading government bonds data...")
    bonds_data = load_bonds_data()

    print("Loading corporate bonds data...")
    corp_bonds_data = load_corporate_bonds_data()

    print("Calculating credit spreads...")
    spreads = calculate_credit_spreads(bonds_data, corp_bonds_data)

    if not spreads:
        print("Warning: No credit spreads could be calculated. Check data files.", file=sys.stderr)
        return 1

    print(f"Calculated spreads for {len(spreads)} series")

    output = build_output_structure(spreads)

    # Save to file
    output_file = Path(__file__).parent.parent / 'data' / 'credit_spreads_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Credit spreads data saved to {output_file}")

    # Print summary
    print("\n" + "="*60)
    print("CREDIT SPREADS SUMMARY")
    print("="*60)
    print(f"Total series: {len(spreads)}")
    high_risk = sum(1 for s in spreads if s['risk_level'] == 'high')
    print(f"High risk (>500 bps): {high_risk}")
    print(f"Average spread: {output['metadata']['average_spread']:.2f} bps")
    print(f"\nWidest spreads:")
    for item in sorted(spreads, key=lambda x: x['spread'], reverse=True)[:5]:
        print(f"  {item['name']:30} {item['spread']:7.2f} bps  ({item['category']})")

    return 0

if __name__ == '__main__':
    sys.exit(main())
