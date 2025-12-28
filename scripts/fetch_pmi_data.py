#!/usr/bin/env python3
"""
Fetch PMI (Purchasing Managers' Index) Manufacturing data.
PMI below 50 indicates contraction, above 50 indicates expansion.
Data source: OECD API
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import requests

# Country mapping
COUNTRIES = {
    'USA': {'name': 'United States', 'region': 'Americas', 'oecd_code': 'USA'},
    'CAN': {'name': 'Canada', 'region': 'Americas', 'oecd_code': 'CAN'},
    'MEX': {'name': 'Mexico', 'region': 'Latam', 'oecd_code': 'MEX'},
    'BRA': {'name': 'Brazil', 'region': 'Latam', 'oecd_code': 'BRA'},
    'GBR': {'name': 'United Kingdom', 'region': 'Europe', 'oecd_code': 'GBR'},
    'DEU': {'name': 'Germany', 'region': 'Europe', 'oecd_code': 'DEU'},
    'FRA': {'name': 'France', 'region': 'Europe', 'oecd_code': 'FRA'},
    'ITA': {'name': 'Italy', 'region': 'Europe', 'oecd_code': 'ITA'},
    'ESP': {'name': 'Spain', 'region': 'Europe', 'oecd_code': 'ESP'},
    'NLD': {'name': 'Netherlands', 'region': 'Europe', 'oecd_code': 'NLD'},
    'POL': {'name': 'Poland', 'region': 'Europe', 'oecd_code': 'POL'},
    'TUR': {'name': 'Turkey', 'region': 'Europe', 'oecd_code': 'TUR'},
    'RUS': {'name': 'Russia', 'region': 'Europe', 'oecd_code': 'RUS'},
    'CHN': {'name': 'China', 'region': 'Asia', 'oecd_code': 'CHN'},
    'JPN': {'name': 'Japan', 'region': 'Asia', 'oecd_code': 'JPN'},
    'KOR': {'name': 'South Korea', 'region': 'Asia', 'oecd_code': 'KOR'},
    'IND': {'name': 'India', 'region': 'Asia', 'oecd_code': 'IND'},
    'IDN': {'name': 'Indonesia', 'region': 'Asia', 'oecd_code': 'IDN'},
    'AUS': {'name': 'Australia', 'region': 'Oceania', 'oecd_code': 'AUS'},
    'ZAF': {'name': 'South Africa', 'region': 'Africa', 'oecd_code': 'ZAF'}
}

def fetch_oecd_pmi_data():
    """
    Fetch PMI data from OECD API.
    Note: OECD API requires specific dataset codes.
    Using CLI (Composite Leading Indicator) as proxy when PMI not available.
    """

    # For demo purposes, using mock data based on typical PMI values
    # In production, you would integrate with S&P Global PMI, IHS Markit, or OECD CLI
    print("Generating PMI data based on economic indicators...")

    # Mock data - in production, replace with actual API calls
    mock_pmi_values = {
        'USA': 48.5,
        'CAN': 49.2,
        'MEX': 50.8,
        'BRA': 47.3,
        'GBR': 46.8,
        'DEU': 45.2,
        'FRA': 44.6,
        'ITA': 46.1,
        'ESP': 47.5,
        'NLD': 48.9,
        'POL': 49.7,
        'TUR': 52.3,
        'RUS': 51.2,
        'CHN': 51.4,
        'JPN': 48.1,
        'KOR': 49.8,
        'IND': 55.3,
        'IDN': 53.2,
        'AUS': 48.7,
        'ZAF': 49.5
    }

    results = []
    for code, info in COUNTRIES.items():
        if code in mock_pmi_values:
            value = mock_pmi_values[code]
            results.append({
                'code': code,
                'country': info['name'],
                'region': info['region'],
                'value': value,
                'status': 'expansion' if value >= 50 else 'contraction',
                'distance_from_50': round(value - 50, 2)
            })

    return results

def build_output_structure(pmi_data):
    """Build the output JSON structure."""

    # Sort by PMI value
    current_data = sorted(pmi_data, key=lambda x: x['value'], reverse=True)

    # Build timeseries (for now, just current data point)
    timeseries = {}
    for item in pmi_data:
        timeseries[item['code']] = {
            'country': item['country'],
            'region': item['region'],
            'data': [{
                'date': datetime.now().strftime('%Y-%m-%d'),
                'value': item['value'],
                'status': item['status']
            }]
        }

    contracting = sum(1 for d in pmi_data if d['value'] < 50)

    output = {
        'metadata': {
            'source': 'OECD CLI / S&P Global PMI (mock data)',
            'indicator': 'PMI Manufacturing',
            'description': 'Purchasing Managers Index for manufacturing sector. Values below 50 indicate contraction, above 50 indicate expansion.',
            'unit': 'index',
            'fetched_at': datetime.now().isoformat(),
            'warning_threshold': 50,
            'total_countries': len(pmi_data),
            'contracting_count': contracting
        },
        'data': current_data,
        'timeseries': timeseries
    }

    return output

def main():
    print("Fetching PMI Manufacturing data...")
    pmi_data = fetch_oecd_pmi_data()

    print(f"Retrieved data for {len(pmi_data)} countries")

    output = build_output_structure(pmi_data)

    # Save to file
    output_file = Path(__file__).parent.parent / 'data' / 'pmi_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] PMI data saved to {output_file}")

    # Print summary
    print("\n" + "="*60)
    print("PMI MANUFACTURING SUMMARY")
    print("="*60)
    print(f"Total countries: {len(pmi_data)}")
    contracting = sum(1 for d in pmi_data if d['value'] < 50)
    print(f"Contracting: {contracting} ({contracting/len(pmi_data)*100:.1f}%)")
    print(f"\nLowest PMI (most contracting):")
    for item in sorted(pmi_data, key=lambda x: x['value'])[:5]:
        status = "[!] CONTRACTING" if item['value'] < 50 else "[OK] Expanding"
        print(f"  {item['country']:20} {item['value']:5.1f}  {status}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
