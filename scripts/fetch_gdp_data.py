"""
IMF DataMapper GDP Data Fetcher
Indicator: NGDPD (GDP, current prices, USD billions)
"""

import requests
import json
import os
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, CURRENT_YEAR

IMF_URL = "https://www.imf.org/external/datamapper/api/v1/NGDPD"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "gdp_data.json")


def fetch_gdp_data():
    print("Downloading GDP data from IMF...")
    print(f"URL: {IMF_URL}\n")

    response = requests.get(IMF_URL, timeout=30)
    response.raise_for_status()

    data = response.json()
    gdp_data = data.get("values", {}).get("NGDPD", {})

    if not gdp_data:
        raise ValueError("No data found in response")

    all_years = set()
    for country_data in gdp_data.values():
        all_years.update(country_data.keys())

    years = sorted([y for y in all_years if y.isdigit()], reverse=True)

    real_years = [y for y in years if int(y) <= CURRENT_YEAR]
    projection_years = [y for y in years if int(y) > CURRENT_YEAR]

    print(f"Years with real data: {real_years[-1] if real_years else 'N/A'} - {real_years[0] if real_years else 'N/A'}")
    print(f"Years with projections: {projection_years[-1] if projection_years else 'N/A'} - {projection_years[0] if projection_years else 'N/A'}")

    result = {
        "metadata": {
            "source": "IMF DataMapper",
            "indicator": "NGDPD",
            "description": "GDP, current prices (USD billions)",
            "fetched_at": datetime.now().isoformat(),
            "available_years": years[:25],
            "last_real_year": str(CURRENT_YEAR),
            "projection_years": projection_years
        },
        "data": {},
        "timeseries": {}
    }

    for year in years[:25]:
        year_data = []
        for code, values in gdp_data.items():
            if code not in COUNTRY_NAMES:
                continue
            value = values.get(year)
            if value is None:
                continue
            try:
                gdp_value = round(float(value) * 1e9, 0)  # Convert billions to actual USD
                year_data.append({
                    "code": code,
                    "country": COUNTRY_NAMES[code],
                    "value": gdp_value,
                    "region": REGIONS.get(code, "Other"),
                    "isProjection": int(year) > CURRENT_YEAR
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["value"])
        print(f"  {year}: {len(year_data)} countries {'(projection)' if int(year) > CURRENT_YEAR else ''}")

    for code, values in gdp_data.items():
        if code not in COUNTRY_NAMES:
            continue

        series = []
        for year in sorted(years[:25]):
            value = values.get(year)
            if value is not None:
                try:
                    series.append({
                        "year": year,
                        "value": round(float(value) * 1e9, 0),
                        "isProjection": int(year) > CURRENT_YEAR
                    })
                except (ValueError, TypeError):
                    continue

        if series:
            result["timeseries"][code] = {
                "country": COUNTRY_NAMES[code],
                "region": REGIONS.get(code, "Other"),
                "data": series
            }

    return result


def main():
    try:
        data = fetch_gdp_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {OUTPUT_FILE}")
        print(f"Total years: {len(data['data'])}")
        print(f"Total countries: {len(data['timeseries'])}")

        latest_year = data["metadata"]["last_real_year"]
        print(f"\nTop 10 countries by GDP ({latest_year}):")
        for i, country in enumerate(data["data"][latest_year][:10], 1):
            print(f"  {i}. {country['country']}: ${country['value']/1e12:.2f}T")

    except requests.RequestException as e:
        print(f"Connection error: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
