"""
Government Bond Yields Data Fetcher
Uses investpy to fetch bond yields from Investing.com
"""

import json
import os
from datetime import datetime, timedelta

try:
    import investpy
except ImportError:
    print("Installing investpy...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'investpy'])
    import investpy

from country_mappings import COUNTRY_NAMES, REGIONS, CURRENT_YEAR

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "bonds_data.json")

# Map investpy country names to our ISO3 codes
INVESTPY_TO_ISO3 = {
    "united states": "USA",
    "japan": "JPN",
    "china": "CHN",
    "germany": "DEU",
    "united kingdom": "GBR",
    "france": "FRA",
    "italy": "ITA",
    "spain": "ESP",
    "brazil": "BRA",
    "india": "IND",
    "russia": "RUS",
    "canada": "CAN",
    "australia": "AUS",
    "mexico": "MEX",
    "south korea": "KOR",
    "indonesia": "IDN",
    "netherlands": "NLD",
    "switzerland": "CHE",
    "poland": "POL",
    "belgium": "BEL",
    "sweden": "SWE",
    "austria": "AUT",
    "norway": "NOR",
    "ireland": "IRL",
    "singapore": "SGP",
    "portugal": "PRT",
    "greece": "GRC",
    "denmark": "DNK",
    "finland": "FIN",
    "chile": "CHL",
    "colombia": "COL",
    "peru": "PER",
    "egypt": "EGY",
    "pakistan": "PAK",
    "thailand": "THA",
    "malaysia": "MYS",
    "philippines": "PHL",
    "vietnam": "VNM",
    "nigeria": "NGA",
    "kenya": "KEN",
    "morocco": "MAR",
    "czech republic": "CZE",
    "romania": "ROU",
    "hungary": "HUN",
    "new zealand": "NZL",
    "israel": "ISR",
    "qatar": "QAT",
    "jordan": "JOR",
    "croatia": "HRV",
    "slovakia": "SVK",
    "slovenia": "SVN",
    "lithuania": "LTU",
    "latvia": "LVA",
    "iceland": "ISL",
    "cyprus": "CYP",
    "malta": "MLT",
    "taiwan": "TWN",
    "sri lanka": "LKA",
    "serbia": "SRB",
    "hong kong": "HKG",
    "south africa": "ZAF",
    "turkey": "TUR",
    "argentina": "ARG",
    "saudi arabia": "SAU",
    "united arab emirates": "ARE",
}

# Bond durations to fetch (common maturities)
BOND_DURATIONS = ["1Y", "2Y", "3Y", "5Y", "7Y", "10Y", "20Y", "30Y"]


def get_bond_name_for_duration(bonds_list, duration):
    """Find bond name matching the duration"""
    duration_lower = duration.lower()
    for bond in bonds_list:
        name_lower = bond['name'].lower()
        # Match patterns like "10Y", "10-year", "10 year"
        if duration_lower in name_lower or duration_lower.replace('y', ' year') in name_lower:
            return bond['name']
    return None


def fetch_bonds_data():
    print("Downloading Government Bond Yields data...")

    # Get list of countries with bond data
    try:
        countries_with_bonds = investpy.bonds.get_bond_countries()
    except Exception as e:
        print(f"Error getting bond countries: {e}")
        return None

    print(f"Found {len(countries_with_bonds)} countries with bond data")

    result = {
        "metadata": {
            "source": "Investing.com via investpy",
            "indicator": "Government Bond Yields",
            "description": "Government bond yields by maturity",
            "fetched_at": datetime.now().isoformat(),
            "available_durations": BOND_DURATIONS,
            "last_real_year": str(CURRENT_YEAR)
        },
        "data": {},  # By duration: {"10Y": [{"code": "USA", "country": "USA", "value": 4.5, ...}]}
        "timeseries": {}  # By country and duration
    }

    # Initialize data structure for each duration
    for duration in BOND_DURATIONS:
        result["data"][duration] = []

    for country in countries_with_bonds:
        iso3_code = INVESTPY_TO_ISO3.get(country.lower())
        if not iso3_code or iso3_code not in COUNTRY_NAMES:
            continue

        country_name = COUNTRY_NAMES[iso3_code]
        region = REGIONS.get(iso3_code, "Other")

        print(f"  Fetching bonds for {country_name}...")

        try:
            # Get bonds overview for the country
            bonds_overview = investpy.bonds.get_bonds_overview(country)

            if bonds_overview is None or bonds_overview.empty:
                continue

            # Initialize timeseries for this country
            if iso3_code not in result["timeseries"]:
                result["timeseries"][iso3_code] = {
                    "country": country_name,
                    "region": region,
                    "yields": {}  # By duration
                }

            # Process each bond
            for _, bond in bonds_overview.iterrows():
                bond_name = bond.get('name', '')
                current_yield = bond.get('last')

                if current_yield is None:
                    continue

                # Determine duration from bond name
                duration = None
                bond_name_lower = bond_name.lower()
                for d in BOND_DURATIONS:
                    d_lower = d.lower()
                    # Check various formats: "10Y", "10-Year", "10 Year"
                    if d_lower in bond_name_lower or d_lower.replace('y', '-year') in bond_name_lower or d_lower.replace('y', ' year') in bond_name_lower:
                        duration = d
                        break

                if duration is None:
                    # Try to extract number + year pattern
                    import re
                    match = re.search(r'(\d+)[\s-]?(?:year|yr|y)', bond_name_lower)
                    if match:
                        years = int(match.group(1))
                        duration = f"{years}Y"
                        if duration not in BOND_DURATIONS:
                            continue

                if duration is None:
                    continue

                try:
                    yield_value = float(current_yield)
                except (ValueError, TypeError):
                    continue

                # Add to current data
                result["data"][duration].append({
                    "code": iso3_code,
                    "country": country_name,
                    "value": round(yield_value, 3),
                    "region": region,
                    "isProjection": False
                })

                # Add to timeseries
                result["timeseries"][iso3_code]["yields"][duration] = round(yield_value, 3)

        except Exception as e:
            print(f"    Error: {e}")
            continue

    # Sort data by yield (descending)
    for duration in BOND_DURATIONS:
        result["data"][duration] = sorted(result["data"][duration], key=lambda x: -x["value"])
        print(f"  {duration}: {len(result['data'][duration])} countries")

    return result


def main():
    try:
        data = fetch_bonds_data()

        if data is None:
            print("Failed to fetch data")
            return

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {OUTPUT_FILE}")
        print(f"Total countries: {len(data['timeseries'])}")

        # Show top 10 for 10Y bonds
        if "10Y" in data["data"] and data["data"]["10Y"]:
            print(f"\nTop 10 countries by 10Y bond yield:")
            for i, country in enumerate(data["data"]["10Y"][:10], 1):
                print(f"  {i}. {country['country']}: {country['value']}%")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
