#!/usr/bin/env python3
"""
Fetch Initial Unemployment Claims data.
Rising claims signal labor market weakness and potential recession.
Data source: OECD / National statistical agencies (using mock data)
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# Country mapping with typical weekly claims
COUNTRIES = {
    'USA': {'name': 'United States', 'region': 'Americas', 'baseline_claims': 220000, 'population': 331},
    'CAN': {'name': 'Canada', 'region': 'Americas', 'baseline_claims': 15000, 'population': 38},
    'MEX': {'name': 'Mexico', 'region': 'Latam', 'baseline_claims': 35000, 'population': 128},
    'BRA': {'name': 'Brazil', 'region': 'Latam', 'baseline_claims': 55000, 'population': 214},
    'GBR': {'name': 'United Kingdom', 'region': 'Europe', 'baseline_claims': 28000, 'population': 67},
    'DEU': {'name': 'Germany', 'region': 'Europe', 'baseline_claims': 18000, 'population': 83},
    'FRA': {'name': 'France', 'region': 'Europe', 'baseline_claims': 22000, 'population': 67},
    'ITA': {'name': 'Italy', 'region': 'Europe', 'baseline_claims': 24000, 'population': 60},
    'ESP': {'name': 'Spain', 'region': 'Europe', 'baseline_claims': 21000, 'population': 47},
    'NLD': {'name': 'Netherlands', 'region': 'Europe', 'baseline_claims': 8000, 'population': 17},
    'POL': {'name': 'Poland', 'region': 'Europe', 'baseline_claims': 12000, 'population': 38},
    'SWE': {'name': 'Sweden', 'region': 'Europe', 'baseline_claims': 6000, 'population': 10},
    'TUR': {'name': 'Turkey', 'region': 'Europe', 'baseline_claims': 45000, 'population': 85},
    'CHN': {'name': 'China', 'region': 'Asia', 'baseline_claims': 180000, 'population': 1412},
    'JPN': {'name': 'Japan', 'region': 'Asia', 'baseline_claims': 25000, 'population': 125},
    'KOR': {'name': 'South Korea', 'region': 'Asia', 'baseline_claims': 15000, 'population': 52},
    'IND': {'name': 'India', 'region': 'Asia', 'baseline_claims': 95000, 'population': 1408},
    'IDN': {'name': 'Indonesia', 'region': 'Asia', 'baseline_claims': 42000, 'population': 273},
    'AUS': {'name': 'Australia', 'region': 'Oceania', 'baseline_claims': 12000, 'population': 26},
    'NZL': {'name': 'New Zealand', 'region': 'Oceania', 'baseline_claims': 3000, 'population': 5}
}

def fetch_unemployment_claims_data():
    """
    Fetch unemployment claims data.
    Note: This uses mock data. In production, integrate with:
    - OECD Employment API
    - U.S. Department of Labor (for USA)
    - Eurostat (for EU countries)
    - National statistical agencies
    """

    print("Generating unemployment claims data...")

    # Mock current values (simulating some stress in labor market)
    results = []
    for code, info in COUNTRIES.items():
        baseline = info['baseline_claims']
        population = info['population']  # in millions

        # Simulate current claims with some variation
        # Higher variation = more stress
        import random
        random.seed(hash(code))  # Deterministic for consistency
        variation = random.uniform(0.9, 1.3)  # -10% to +30%
        current_claims = int(baseline * variation)

        # Calculate per capita (per million)
        claims_per_million = round(current_claims / population, 0)

        # Calculate change from baseline
        change_pct = round((variation - 1) * 100, 1)

        # Determine trend and risk
        if change_pct > 20:
            trend = 'rising sharply'
            risk_level = 'high'
        elif change_pct > 10:
            trend = 'rising'
            risk_level = 'medium'
        elif change_pct > 0:
            trend = 'increasing'
            risk_level = 'low'
        else:
            trend = 'stable'
            risk_level = 'low'

        results.append({
            'code': code,
            'country': info['name'],
            'region': info['region'],
            'claims': current_claims,
            'claims_per_million': claims_per_million,
            'change_from_baseline': change_pct,
            'trend': trend,
            'risk_level': risk_level
        })

    return results

def build_output_structure(claims_data):
    """Build the output JSON structure."""

    # Sort by claims per million (highest first)
    current_data = sorted(claims_data, key=lambda x: x['claims_per_million'], reverse=True)

    # Build timeseries
    timeseries = {}
    for item in claims_data:
        timeseries[item['code']] = {
            'country': item['country'],
            'region': item['region'],
            'data': [{
                'date': datetime.now().strftime('%Y-%m-%d'),
                'claims': item['claims'],
                'claims_per_million': item['claims_per_million'],
                'trend': item['trend']
            }]
        }

    high_risk = sum(1 for d in claims_data if d['risk_level'] == 'high')
    avg_per_million = sum(d['claims_per_million'] for d in claims_data) / len(claims_data)

    output = {
        'metadata': {
            'source': 'OECD / National agencies (mock data)',
            'indicator': 'Initial Unemployment Claims',
            'description': 'Weekly initial jobless claims. Rising claims signal labor market weakness. Sharp increases often precede recessions.',
            'unit': 'weekly claims',
            'per_capita_unit': 'claims per million population',
            'fetched_at': datetime.now().isoformat(),
            'warning_threshold': 'Increases >20% from baseline',
            'total_countries': len(claims_data),
            'high_risk_count': high_risk,
            'average_per_million': round(avg_per_million, 1)
        },
        'data': current_data,
        'timeseries': timeseries
    }

    return output

def main():
    print("Fetching Unemployment Claims data...")
    claims_data = fetch_unemployment_claims_data()

    print(f"Retrieved data for {len(claims_data)} countries")

    output = build_output_structure(claims_data)

    # Save to file
    output_file = Path(__file__).parent.parent / 'data' / 'unemployment_claims_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Unemployment claims data saved to {output_file}")

    # Print summary
    print("\n" + "="*60)
    print("UNEMPLOYMENT CLAIMS SUMMARY")
    print("="*60)
    print(f"Total countries: {len(claims_data)}")
    high_risk = sum(1 for d in claims_data if d['risk_level'] == 'high')
    print(f"High risk (>20% increase): {high_risk}")
    print(f"Average per million: {output['metadata']['average_per_million']:.1f}")
    print(f"\nHighest claims per capita:")
    for item in sorted(claims_data, key=lambda x: x['claims_per_million'], reverse=True)[:5]:
        risk_marker = "[!] HIGH RISK" if item['risk_level'] == 'high' else "[OK]"
        print(f"  {item['country']:20} {item['claims_per_million']:6.0f}/M  ({item['change_from_baseline']:+.1f}%)  {risk_marker}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
