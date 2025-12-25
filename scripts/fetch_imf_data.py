"""
IMF DataMapper Debt/GDP Data Fetcher
Run: python fetch_imf_data.py
Generates: data/imf_debt_data.json
"""

import requests
import json
import os
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, CURRENT_YEAR

IMF_URL = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "imf_debt_data.json")


def fetch_imf_data():
    print(f"Downloading data from IMF...")
    print(f"URL: {IMF_URL}\n")

    response = requests.get(IMF_URL, timeout=30)
    response.raise_for_status()

    data = response.json()
    debt_data = data.get("values", {}).get("GGXWDG_NGDP", {})

    if not debt_data:
        raise ValueError("No data found in response")

    # Get available years
    all_years = set()
    for country_data in debt_data.values():
        all_years.update(country_data.keys())

    years = sorted([y for y in all_years if y.isdigit()], reverse=True)

    # Separate real years from projections
    real_years = [y for y in years if int(y) <= CURRENT_YEAR]
    projection_years = [y for y in years if int(y) > CURRENT_YEAR]

    print(f"Years with real data: {real_years[0]} - {real_years[-1]}")
    print(f"Years with projections: {projection_years[-1] if projection_years else 'N/A'} - {projection_years[0] if projection_years else 'N/A'}")

    # Process data by year
    result = {
        "metadata": {
            "source": "IMF DataMapper",
            "indicator": "GGXWDG_NGDP",
            "description": "General Government Gross Debt (% of GDP)",
            "fetched_at": datetime.now().isoformat(),
            "available_years": years[:25],
            "last_real_year": str(CURRENT_YEAR),
            "projection_years": projection_years
        },
        "data": {},
        "timeseries": {}
    }

    # Data by year (for bar chart)
    for year in years[:25]:
        year_data = []
        for code, values in debt_data.items():
            if code not in COUNTRY_NAMES:
                continue
            value = values.get(year)
            if value is None:
                continue
            try:
                debt = round(float(value), 1)
                year_data.append({
                    "code": code,
                    "country": COUNTRY_NAMES[code],
                    "debt": debt,
                    "region": REGIONS.get(code, "Other"),
                    "isProjection": int(year) > CURRENT_YEAR
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["debt"])
        print(f"  {year}: {len(year_data)} countries {'(projection)' if int(year) > CURRENT_YEAR else ''}")

    # Time series by country (for line chart)
    for code, values in debt_data.items():
        if code not in COUNTRY_NAMES:
            continue

        series = []
        for year in sorted(years[:25]):
            value = values.get(year)
            if value is not None:
                try:
                    series.append({
                        "year": year,
                        "debt": round(float(value), 1),
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
        data = fetch_imf_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {OUTPUT_FILE}")
        print(f"Total years: {len(data['data'])}")
        print(f"Total countries with time series: {len(data['timeseries'])}")

        # Show top 10 of most recent real year
        latest_year = data["metadata"]["last_real_year"]
        print(f"\nTop 10 countries by Debt/GDP ({latest_year}):")
        for i, country in enumerate(data["data"][latest_year][:10], 1):
            print(f"  {i}. {country['country']}: {country['debt']}%")

    except requests.RequestException as e:
        print(f"Connection error: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
