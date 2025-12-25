"""
IMF DataMapper Public Debt Data Fetcher
Calculates absolute debt from GDP (NGDPD) and debt/GDP ratio (GGXWDG_NGDP)
"""

import requests
import json
import os
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, CURRENT_YEAR

IMF_GDP_URL = "https://www.imf.org/external/datamapper/api/v1/NGDPD"
IMF_DEBT_RATIO_URL = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "debt_data.json")


def fetch_debt_data():
    print("Downloading Public Debt data from IMF...")

    # Fetch GDP data
    print(f"Fetching GDP...")
    gdp_response = requests.get(IMF_GDP_URL, timeout=30)
    gdp_response.raise_for_status()
    gdp_json = gdp_response.json()
    gdp_data = gdp_json.get("values", {}).get("NGDPD", {})

    # Fetch Debt/GDP ratio
    print(f"Fetching Debt/GDP ratio...")
    ratio_response = requests.get(IMF_DEBT_RATIO_URL, timeout=30)
    ratio_response.raise_for_status()
    ratio_json = ratio_response.json()
    ratio_data = ratio_json.get("values", {}).get("GGXWDG_NGDP", {})

    if not gdp_data or not ratio_data:
        raise ValueError("No data found in response")

    # Get all years
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
            "indicator": "NGDPD * GGXWDG_NGDP / 100",
            "description": "General government gross debt (USD billions, calculated)",
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
        for code in COUNTRY_NAMES:
            gdp = gdp_data.get(code, {}).get(year)
            ratio = ratio_data.get(code, {}).get(year)

            if gdp is None or ratio is None:
                continue
            try:
                # GDP is in billions, ratio is %, so debt = gdp * ratio / 100
                debt_value = round(float(gdp) * float(ratio) / 100 * 1e9, 0)  # Convert to actual USD
                year_data.append({
                    "code": code,
                    "country": COUNTRY_NAMES[code],
                    "value": debt_value,
                    "region": REGIONS.get(code, "Other"),
                    "isProjection": int(year) > CURRENT_YEAR
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["value"])
        print(f"  {year}: {len(year_data)} countries {'(projection)' if int(year) > CURRENT_YEAR else ''}")

    # Build timeseries
    for code in COUNTRY_NAMES:
        series = []
        for year in sorted(years[:25]):
            gdp = gdp_data.get(code, {}).get(year)
            ratio = ratio_data.get(code, {}).get(year)

            if gdp is not None and ratio is not None:
                try:
                    debt_value = round(float(gdp) * float(ratio) / 100 * 1e9, 0)
                    series.append({
                        "year": year,
                        "value": debt_value,
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
        data = fetch_debt_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {OUTPUT_FILE}")
        print(f"Total years: {len(data['data'])}")
        print(f"Total countries: {len(data['timeseries'])}")

        latest_year = data["metadata"]["last_real_year"]
        if latest_year in data["data"]:
            print(f"\nTop 10 countries by Public Debt ({latest_year}):")
            for i, country in enumerate(data["data"][latest_year][:10], 1):
                print(f"  {i}. {country['country']}: ${country['value']/1e12:.2f}T")

    except requests.RequestException as e:
        print(f"Connection error: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
