"""
World Bank M2 Money Supply Data Fetcher
Indicator: FM.LBL.BMNY.GD.ZS (Broad money, % of GDP)
           and NY.GDP.MKTP.CD (GDP current USD) to calculate M2 in USD
"""

import requests
import json
import os
import time
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, ISO3_TO_ISO2, CURRENT_YEAR

# World Bank API
WB_M2_URL = "https://api.worldbank.org/v2/country/all/indicator/FM.LBL.BMNY.GD.ZS?format=json&per_page=20000&date=2000:{year}"
WB_GDP_URL = "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=20000&date=2000:{year}"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "m2_data.json")

# Reverse mapping ISO2 -> ISO3
ISO2_TO_ISO3 = {v: k for k, v in ISO3_TO_ISO2.items()}

MAX_RETRIES = 3
RETRY_DELAY = 5


def fetch_with_retry(url, description):
    """Fetch URL with retries on failure"""
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"  Attempt {attempt + 1}/{MAX_RETRIES} failed for {description}: {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"  Retrying in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                raise


def fetch_m2_data():
    print("Downloading M2 data from World Bank...")

    # Fetch M2 as % of GDP
    print(f"Fetching M2 (% of GDP)...")
    m2_json = fetch_with_retry(WB_M2_URL.format(year=CURRENT_YEAR), "M2")

    # Fetch GDP in current USD
    print(f"Fetching GDP (USD)...")
    gdp_json = fetch_with_retry(WB_GDP_URL.format(year=CURRENT_YEAR), "GDP")

    if len(m2_json) < 2 or len(gdp_json) < 2:
        raise ValueError("No data found")

    # Parse M2 % data
    m2_pct_data = {}
    for item in m2_json[1] or []:
        country_code = item.get("country", {}).get("id")
        year = item.get("date")
        value = item.get("value")
        if country_code and year and value is not None:
            if country_code not in m2_pct_data:
                m2_pct_data[country_code] = {}
            m2_pct_data[country_code][year] = float(value)

    # Parse GDP data
    gdp_data = {}
    for item in gdp_json[1] or []:
        country_code = item.get("country", {}).get("id")
        year = item.get("date")
        value = item.get("value")
        if country_code and year and value is not None:
            if country_code not in gdp_data:
                gdp_data[country_code] = {}
            gdp_data[country_code][year] = float(value)

    # Get all years
    all_years = set()
    for country_data in m2_pct_data.values():
        all_years.update(country_data.keys())
    years = sorted([y for y in all_years if y.isdigit()], reverse=True)[:25]

    print(f"Available years: {years[-1] if years else 'N/A'} - {years[0] if years else 'N/A'}")

    result = {
        "metadata": {
            "source": "World Bank",
            "indicator": "FM.LBL.BMNY.GD.ZS * NY.GDP.MKTP.CD",
            "description": "Broad money M2 (USD)",
            "fetched_at": datetime.now().isoformat(),
            "available_years": years,
            "last_real_year": str(min(CURRENT_YEAR, int(years[0]) if years else CURRENT_YEAR)),
            "projection_years": []
        },
        "data": {},
        "timeseries": {}
    }

    for year in years:
        year_data = []
        for iso2_code in m2_pct_data:
            iso3_code = ISO2_TO_ISO3.get(iso2_code)
            if iso3_code not in COUNTRY_NAMES:
                continue

            m2_pct = m2_pct_data.get(iso2_code, {}).get(year)
            gdp = gdp_data.get(iso2_code, {}).get(year)

            if m2_pct is None or gdp is None:
                continue

            try:
                m2_value = round((m2_pct / 100) * gdp, 0)
                year_data.append({
                    "code": iso3_code,
                    "country": COUNTRY_NAMES[iso3_code],
                    "value": m2_value,
                    "region": REGIONS.get(iso3_code, "Otro"),
                    "isProjection": False
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["value"])
        print(f"  {year}: {len(year_data)} countries")

    # Build timeseries
    for iso2_code in m2_pct_data:
        iso3_code = ISO2_TO_ISO3.get(iso2_code)
        if iso3_code not in COUNTRY_NAMES:
            continue

        series = []
        for year in sorted(years):
            m2_pct = m2_pct_data.get(iso2_code, {}).get(year)
            gdp = gdp_data.get(iso2_code, {}).get(year)

            if m2_pct is not None and gdp is not None:
                try:
                    m2_value = round((m2_pct / 100) * gdp, 0)
                    series.append({
                        "year": year,
                        "value": m2_value,
                        "isProjection": False
                    })
                except (ValueError, TypeError):
                    continue

        if series:
            result["timeseries"][iso3_code] = {
                "country": COUNTRY_NAMES[iso3_code],
                "region": REGIONS.get(iso3_code, "Otro"),
                "data": series
            }

    # Build World M2 timeseries (sum of all countries)
    world_series = []
    for year in sorted(years):
        year_total = 0
        country_count = 0
        for year_entry in result["data"].get(year, []):
            year_total += year_entry["value"]
            country_count += 1
        if country_count > 0:
            world_series.append({
                "year": year,
                "value": round(year_total, 0),
                "isProjection": False
            })

    if world_series:
        result["timeseries"]["WLD"] = {
            "country": "World",
            "region": "Global",
            "data": world_series
        }
        print(f"  World M2 calculated: {len(world_series)} years")

    return result


def main():
    try:
        data = fetch_m2_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {OUTPUT_FILE}")
        print(f"Total years: {len(data['data'])}")
        print(f"Total countries: {len(data['timeseries'])}")

        latest_year = data["metadata"]["last_real_year"]
        if latest_year in data["data"]:
            print(f"\nTop 10 countries by M2 ({latest_year}):")
            for i, country in enumerate(data["data"][latest_year][:10], 1):
                print(f"  {i}. {country['country']}: ${country['value']/1e12:.2f}T")

    except requests.RequestException as e:
        print(f"Connection error: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
