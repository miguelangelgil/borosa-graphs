"""
Descargador de datos de Exportaciones del Banco Mundial
Indicador: NE.EXP.GNFS.CD (Exports of goods and services, current USD)
"""

import requests
import json
import os
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, ISO3_TO_ISO2, CURRENT_YEAR

WB_URL = "https://api.worldbank.org/v2/country/all/indicator/NE.EXP.GNFS.CD?format=json&per_page=20000&date=2000:{year}"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "exports_data.json")

# Reverse mapping ISO2 -> ISO3
ISO2_TO_ISO3 = {v: k for k, v in ISO3_TO_ISO2.items()}


def fetch_exports_data():
    print("Descargando datos de Exportaciones del Banco Mundial...")
    print(f"URL: {WB_URL.format(year=CURRENT_YEAR)}\n")

    response = requests.get(WB_URL.format(year=CURRENT_YEAR), timeout=60)
    response.raise_for_status()
    data_json = response.json()

    if len(data_json) < 2:
        raise ValueError("No se encontraron datos")

    # Parse data
    exports_data = {}
    for item in data_json[1] or []:
        country_code = item.get("country", {}).get("id")
        year = item.get("date")
        value = item.get("value")
        if country_code and year and value is not None:
            if country_code not in exports_data:
                exports_data[country_code] = {}
            exports_data[country_code][year] = float(value)

    # Get all years
    all_years = set()
    for country_data in exports_data.values():
        all_years.update(country_data.keys())
    years = sorted([y for y in all_years if y.isdigit()], reverse=True)[:25]

    print(f"Años disponibles: {years[-1] if years else 'N/A'} - {years[0] if years else 'N/A'}")

    result = {
        "metadata": {
            "source": "World Bank",
            "indicator": "NE.EXP.GNFS.CD",
            "description": "Exports of goods and services (current USD)",
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
        for iso2_code, values in exports_data.items():
            iso3_code = ISO2_TO_ISO3.get(iso2_code)
            if iso3_code not in COUNTRY_NAMES:
                continue

            value = values.get(year)
            if value is None:
                continue

            try:
                year_data.append({
                    "code": iso3_code,
                    "country": COUNTRY_NAMES[iso3_code],
                    "value": round(value, 0),
                    "region": REGIONS.get(iso3_code, "Otro"),
                    "isProjection": False
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["value"])
        print(f"  {year}: {len(year_data)} países")

    # Build timeseries
    for iso2_code, values in exports_data.items():
        iso3_code = ISO2_TO_ISO3.get(iso2_code)
        if iso3_code not in COUNTRY_NAMES:
            continue

        series = []
        for year in sorted(years):
            value = values.get(year)
            if value is not None:
                try:
                    series.append({
                        "year": year,
                        "value": round(value, 0),
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

    return result


def main():
    try:
        data = fetch_exports_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ Datos guardados en: {OUTPUT_FILE}")
        print(f"✓ Total años: {len(data['data'])}")
        print(f"✓ Total países: {len(data['timeseries'])}")

        latest_year = data["metadata"]["last_real_year"]
        if latest_year in data["data"]:
            print(f"\nTop 10 países por Exportaciones ({latest_year}):")
            for i, country in enumerate(data["data"][latest_year][:10], 1):
                print(f"  {i}. {country['country']}: ${country['value']/1e12:.2f}T")

    except requests.RequestException as e:
        print(f"Error de conexión: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
