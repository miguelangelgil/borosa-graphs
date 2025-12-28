#!/usr/bin/env python3
"""
Fetch Consumer Confidence data from FRED (Federal Reserve Economic Data).
Consumer confidence below 100 indicates pessimism about the economy.
Declining confidence typically precedes reduced consumer spending.
Data source: FRED - OECD Composite Consumer Confidence Index
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import requests

# FRED Series IDs for Consumer Confidence by country
FRED_SERIES = {
    'USA': 'USACSCICP02STSAM',
    'GBR': 'CSCICP02GBM460S',
    'DEU': 'CSCICP02DEM460S',
    'FRA': 'CSCICP02FRM460S',
    'ITA': 'CSCICP02ITM460S',
    'ESP': 'CSCICP02ESM460S',
    'CAN': 'CSCICP02CAM460S',
    'JPN': 'CSCICP02JPM460S',
    'AUS': 'CSCICP02AUM460S',
    'CHN': 'CSCICP02CNM460S',
    'KOR': 'CSCICP02KRM460S',
    'MEX': 'CSCICP02MXM460S',
    'BRA': 'CSCICP02BRM460S',
    'IND': 'CSCICP02INM460S',
    'RUS': 'CSCICP02RUM460S',
    'NLD': 'CSCICP02NLM460S',
    'POL': 'CSCICP02PLM460S',
    'SWE': 'CSCICP02SEM460S',
    'TUR': 'CSCICP02TRM460S',
    'IDN': 'CSCICP02IDM460S',
}

COUNTRY_NAMES = {
    'USA': 'United States', 'GBR': 'United Kingdom', 'DEU': 'Germany',
    'FRA': 'France', 'ITA': 'Italy', 'ESP': 'Spain', 'CAN': 'Canada',
    'JPN': 'Japan', 'AUS': 'Australia', 'CHN': 'China', 'KOR': 'South Korea',
    'MEX': 'Mexico', 'BRA': 'Brazil', 'IND': 'India', 'RUS': 'Russia',
    'NLD': 'Netherlands', 'POL': 'Poland', 'SWE': 'Sweden', 'TUR': 'Turkey',
    'IDN': 'Indonesia',
}

REGION_MAP = {
    'USA': 'Americas', 'CAN': 'Americas', 'MEX': 'Americas', 'BRA': 'Latam',
    'GBR': 'Europe', 'DEU': 'Europe', 'FRA': 'Europe', 'ITA': 'Europe', 'ESP': 'Europe',
    'NLD': 'Europe', 'POL': 'Europe', 'SWE': 'Europe', 'RUS': 'Europe', 'TUR': 'Europe',
    'CHN': 'Asia', 'JPN': 'Asia', 'IND': 'Asia', 'KOR': 'Asia', 'IDN': 'Asia',
    'AUS': 'Oceania',
}

def fetch_fred_series(series_id):
    """Fetch current data from FRED."""
    url = f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}'

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching {series_id}: {e}", file=sys.stderr)
        return None

def parse_fred_csv(csv_text):
    """Parse FRED CSV format and get latest value."""
    lines = csv_text.strip().split('\n')
    if len(lines) < 2:
        return None

    data_lines = lines[1:]

    # Get the last valid data point
    for line in reversed(data_lines):
        parts = line.split(',')
        if len(parts) != 2:
            continue

        date, value = parts
        if value == '.' or value == '':
            continue

        try:
            return {'date': date, 'value': float(value)}
        except ValueError:
            continue

    return None

def main():
    print("Fetching Consumer Confidence data from FRED...")

    current_values = []

    for country_code, series_id in FRED_SERIES.items():
        print(f"Fetching {COUNTRY_NAMES[country_code]}...")

        csv_data = fetch_fred_series(series_id)
        if not csv_data:
            continue

        latest = parse_fred_csv(csv_data)
        if not latest:
            print(f"  No data for {country_code}")
            continue

        latest_value = latest['value']
        sentiment = 'negative' if latest_value < 100 else 'positive'

        print(f"  Latest: {latest_value:.1f} ({sentiment})")

        current_values.append({
            'code': country_code,
            'country': COUNTRY_NAMES[country_code],
            'region': REGION_MAP.get(country_code, 'Other'),
            'value': round(latest_value, 1),
            'sentiment': sentiment
        })

    if not current_values:
        print("No data retrieved", file=sys.stderr)
        return 1

    negative_count = sum(1 for d in current_values if d['sentiment'] == 'negative')
    avg_confidence = sum(d['value'] for d in current_values) / len(current_values)

    output = {
        'metadata': {
            'source': 'FRED - OECD Composite Consumer Confidence Index',
            'indicator': 'Consumer Confidence Index',
            'description': 'Consumer confidence below 100 indicates pessimism about the economy. Declining confidence typically precedes reduced consumer spending.',
            'unit': 'index (baseline 100)',
            'fetched_at': datetime.now().isoformat(),
            'baseline': 100,
            'total_countries': len(current_values),
            'negative_sentiment_count': negative_count,
            'average_confidence': round(avg_confidence, 1)
        },
        'data': sorted(current_values, key=lambda x: x['value'])
    }

    output_file = Path(__file__).parent.parent / 'data' / 'consumer_confidence_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Consumer Confidence data saved to {output_file}")
    print("\n" + "="*60)
    print("CONSUMER CONFIDENCE SUMMARY")
    print("="*60)
    print(f"Total countries: {len(current_values)}")
    print(f"Negative sentiment (<100): {negative_count}")
    print(f"Average confidence: {avg_confidence:.1f}")
    print(f"\nLowest confidence:")
    for item in sorted(current_values, key=lambda x: x['value'])[:5]:
        marker = "[LOW]" if item['value'] < 100 else "[OK]"
        print(f"  {item['country']:20} {item['value']:5.1f}  {marker}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
