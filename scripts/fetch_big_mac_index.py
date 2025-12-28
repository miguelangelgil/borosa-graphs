#!/usr/bin/env python3
"""
Fetch Big Mac Index data from The Economist's GitHub repository.
The Big Mac Index measures purchasing power parity and affordability.
Rising prices relative to local wages signal reduced purchasing power during recessions.
Data source: The Economist (CC BY 4.0)
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import requests
import csv
from io import StringIO

# Country code mapping (ISO3 to common names)
COUNTRY_NAMES = {
    'ARG': 'Argentina', 'AUS': 'Australia', 'AUT': 'Austria', 'BRA': 'Brazil',
    'GBR': 'Britain', 'CAN': 'Canada', 'CHL': 'Chile', 'CHN': 'China',
    'COL': 'Colombia', 'CRI': 'Costa Rica', 'CZE': 'Czech Republic', 'DNK': 'Denmark',
    'EGY': 'Egypt', 'EST': 'Estonia', 'EUR': 'Euro area', 'FIN': 'Finland',
    'FRA': 'France', 'DEU': 'Germany', 'GRC': 'Greece', 'HKG': 'Hong Kong',
    'HUN': 'Hungary', 'IND': 'India', 'IDN': 'Indonesia', 'IRL': 'Ireland',
    'ISR': 'Israel', 'ITA': 'Italy', 'JPN': 'Japan', 'JOR': 'Jordan',
    'LTU': 'Lithuania', 'MYS': 'Malaysia', 'MEX': 'Mexico', 'NLD': 'Netherlands',
    'NZL': 'New Zealand', 'NOR': 'Norway', 'PAK': 'Pakistan', 'PER': 'Peru',
    'PHL': 'Philippines', 'POL': 'Poland', 'PRT': 'Portugal', 'QAT': 'Qatar',
    'ROU': 'Romania', 'RUS': 'Russia', 'SAU': 'Saudi Arabia', 'SGP': 'Singapore',
    'ZAF': 'South Africa', 'KOR': 'South Korea', 'ESP': 'Spain', 'LKA': 'Sri Lanka',
    'SWE': 'Sweden', 'CHE': 'Switzerland', 'TWN': 'Taiwan', 'THA': 'Thailand',
    'TUR': 'Turkey', 'UKR': 'Ukraine', 'ARE': 'UAE', 'USA': 'United States',
    'URY': 'Uruguay', 'VEN': 'Venezuela', 'VNM': 'Vietnam'
}

# Region mapping
REGION_MAP = {
    'USA': 'Americas', 'CAN': 'Americas', 'MEX': 'Americas', 'BRA': 'Latam', 'ARG': 'Latam',
    'CHL': 'Latam', 'COL': 'Latam', 'PER': 'Latam', 'URY': 'Latam', 'VEN': 'Latam', 'CRI': 'Latam',
    'GBR': 'Europe', 'DEU': 'Europe', 'FRA': 'Europe', 'ITA': 'Europe', 'ESP': 'Europe',
    'NLD': 'Europe', 'POL': 'Europe', 'SWE': 'Europe', 'NOR': 'Europe', 'DNK': 'Europe',
    'FIN': 'Europe', 'AUT': 'Europe', 'CHE': 'Europe', 'CZE': 'Europe', 'HUN': 'Europe',
    'ROU': 'Europe', 'GRC': 'Europe', 'PRT': 'Europe', 'IRL': 'Europe', 'EST': 'Europe',
    'LTU': 'Europe', 'EUR': 'Europe', 'RUS': 'Europe', 'UKR': 'Europe', 'TUR': 'Europe',
    'CHN': 'Asia', 'JPN': 'Asia', 'IND': 'Asia', 'KOR': 'Asia', 'IDN': 'Asia',
    'THA': 'Asia', 'VNM': 'Asia', 'PHL': 'Asia', 'MYS': 'Asia', 'SGP': 'Asia',
    'HKG': 'Asia', 'TWN': 'Asia', 'PAK': 'Asia', 'LKA': 'Asia',
    'AUS': 'Oceania', 'NZL': 'Oceania',
    'SAU': 'Middle East', 'ARE': 'Middle East', 'ISR': 'Middle East', 'EGY': 'Middle East',
    'JOR': 'Middle East', 'QAT': 'Middle East',
    'ZAF': 'Africa'
}

def fetch_big_mac_csv():
    """Fetch Big Mac Index data from The Economist's GitHub repository."""
    url = 'https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-full-index.csv'

    print(f"Fetching Big Mac Index data from The Economist GitHub...")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Error fetching data: {e}", file=sys.stderr)
        return None

def parse_csv_data(csv_text):
    """Parse CSV data and extract latest values per country."""
    csv_file = StringIO(csv_text)
    reader = csv.DictReader(csv_file)

    # Group by country and store latest data
    country_data = {}

    for row in reader:
        iso_a3 = row.get('iso_a3', '').strip()
        if not iso_a3 or iso_a3 not in COUNTRY_NAMES:
            continue

        date = row.get('date', '')
        if not date:
            continue

        # Update if this is more recent
        if iso_a3 not in country_data or date > country_data[iso_a3].get('date', ''):
            country_data[iso_a3] = row

    return country_data

def build_indicator_data(country_data):
    """Build recession indicator data from Big Mac prices."""
    results = []

    for iso_a3, data in country_data.items():
        try:
            country_name = COUNTRY_NAMES.get(iso_a3, iso_a3)
            region = REGION_MAP.get(iso_a3, 'Other')

            # Get price in USD (normalized)
            dollar_price = float(data.get('dollar_price', 0))

            # Get valuation (over/under valued vs USD) - multiply by 100 for percentage
            usd_raw = data.get('USD_raw', '0')
            dollar_valuation = float(usd_raw) * 100 if usd_raw else 0.0

            # Calculate affordability indicator
            affordability_stress = abs(dollar_valuation)

            # Determine risk level based on affordability
            if affordability_stress > 50:
                risk_level = 'high'
                status = 'very expensive' if dollar_valuation > 0 else 'very cheap'
            elif affordability_stress > 25:
                risk_level = 'medium'
                status = 'expensive' if dollar_valuation > 0 else 'cheap'
            else:
                risk_level = 'low'
                status = 'fair value'

            results.append({
                'code': iso_a3,
                'country': country_name,
                'region': region,
                'price_usd': round(dollar_price, 2),
                'valuation_pct': round(dollar_valuation, 1),
                'affordability_stress': round(affordability_stress, 1),
                'status': status,
                'risk_level': risk_level
            })
        except (ValueError, KeyError) as e:
            print(f"Skipping {iso_a3}: {e}")
            continue

    return results

def main():
    print("Fetching Big Mac Index data from The Economist...")

    csv_text = fetch_big_mac_csv()
    if not csv_text:
        print("Failed to fetch data", file=sys.stderr)
        return 1

    print("Parsing CSV data...")
    country_data = parse_csv_data(csv_text)

    if not country_data:
        print("No data parsed from CSV", file=sys.stderr)
        return 1

    print(f"Retrieved data for {len(country_data)} countries")

    print("Building indicator data...")
    indicator_data = build_indicator_data(country_data)

    if not indicator_data:
        print("No indicator data generated", file=sys.stderr)
        return 1

    # Sort by affordability stress (highest first)
    current_data = sorted(indicator_data, key=lambda x: x['affordability_stress'], reverse=True)

    high_risk = sum(1 for d in indicator_data if d['risk_level'] == 'high')
    avg_stress = sum(d['affordability_stress'] for d in indicator_data) / len(indicator_data) if indicator_data else 0

    output = {
        'metadata': {
            'source': 'The Economist Big Mac Index (CC BY 4.0)',
            'indicator': 'Big Mac Affordability Index',
            'description': 'Measures purchasing power parity using Big Mac prices. High stress indicates reduced affordability and purchasing power erosion during economic downturns.',
            'unit': 'USD price & valuation %',
            'fetched_at': datetime.now().isoformat(),
            'warning_threshold': 'Affordability stress >50%',
            'total_countries': len(indicator_data),
            'high_risk_count': high_risk,
            'average_stress': round(avg_stress, 1)
        },
        'data': current_data
    }

    # Save to file
    output_file = Path(__file__).parent.parent / 'data' / 'big_mac_index_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n[OK] Big Mac Index data saved to {output_file}")

    # Print summary
    print("\n" + "="*60)
    print("BIG MAC INDEX SUMMARY")
    print("="*60)
    print(f"Total countries: {len(indicator_data)}")
    print(f"High affordability stress (>50%): {high_risk}")
    print(f"Average stress: {avg_stress:.1f}%")
    print(f"\nHighest affordability stress:")
    for item in sorted(indicator_data, key=lambda x: x['affordability_stress'], reverse=True)[:5]:
        risk_marker = "[!] HIGH" if item['risk_level'] == 'high' else "[OK]"
        print(f"  {item['country']:20} ${item['price_usd']:5.2f}  ({item['valuation_pct']:+6.1f}%)  {risk_marker}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
