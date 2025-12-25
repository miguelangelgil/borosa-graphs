"""
Descargador de datos de Balanza Comercial del Banco Mundial
Indicadores: NE.EXP.GNFS.CD (Exports) y NE.IMP.GNFS.CD (Imports)
"""

import requests
import json
import os
import time
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, ISO3_TO_ISO2, CURRENT_YEAR

WB_EXPORTS_URL = "https://api.worldbank.org/v2/country/all/indicator/NE.EXP.GNFS.CD?format=json&per_page=20000&date=2000:{year}"
WB_IMPORTS_URL = "https://api.worldbank.org/v2/country/all/indicator/NE.IMP.GNFS.CD?format=json&per_page=20000&date=2000:{year}"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "trade_data.json")

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
            print(f"  Intento {attempt + 1}/{MAX_RETRIES} fallido para {description}: {e}")
            if attempt < MAX_RETRIES - 1:
                print(f"  Reintentando en {RETRY_DELAY} segundos...")
                time.sleep(RETRY_DELAY)
            else:
                raise


def fetch_trade_data():
    print("Descargando datos de Balanza Comercial del Banco Mundial...")

    # Fetch exports
    print(f"Obteniendo Exportaciones...")
    exports_json = fetch_with_retry(WB_EXPORTS_URL.format(year=CURRENT_YEAR), "Exportaciones")

    # Fetch imports
    print(f"Obteniendo Importaciones...")
    imports_json = fetch_with_retry(WB_IMPORTS_URL.format(year=CURRENT_YEAR), "Importaciones")

    if len(exports_json) < 2 or len(imports_json) < 2:
        raise ValueError("No se encontraron datos")

    # Parse exports data
    exports_data = {}
    for item in exports_json[1] or []:
        country_code = item.get("country", {}).get("id")
        year = item.get("date")
        value = item.get("value")
        if country_code and year and value is not None:
            if country_code not in exports_data:
                exports_data[country_code] = {}
            exports_data[country_code][year] = float(value)

    # Parse imports data
    imports_data = {}
    for item in imports_json[1] or []:
        country_code = item.get("country", {}).get("id")
        year = item.get("date")
        value = item.get("value")
        if country_code and year and value is not None:
            if country_code not in imports_data:
                imports_data[country_code] = {}
            imports_data[country_code][year] = float(value)

    # Get all years
    all_years = set()
    for country_data in exports_data.values():
        all_years.update(country_data.keys())
    years = sorted([y for y in all_years if y.isdigit()], reverse=True)[:25]

    print(f"Años disponibles: {years[-1] if years else 'N/A'} - {years[0] if years else 'N/A'}")

    result = {
        "metadata": {
            "source": "World Bank",
            "indicator": "NE.EXP.GNFS.CD - NE.IMP.GNFS.CD",
            "description": "Trade balance (Exports - Imports, USD)",
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
        for iso2_code in exports_data:
            iso3_code = ISO2_TO_ISO3.get(iso2_code)
            if iso3_code not in COUNTRY_NAMES:
                continue

            exports = exports_data.get(iso2_code, {}).get(year)
            imports = imports_data.get(iso2_code, {}).get(year)

            if exports is None or imports is None:
                continue

            try:
                balance = round(exports - imports, 0)
                year_data.append({
                    "code": iso3_code,
                    "country": COUNTRY_NAMES[iso3_code],
                    "value": balance,
                    "exports": round(exports, 0),
                    "imports": round(imports, 0),
                    "region": REGIONS.get(iso3_code, "Otro"),
                    "isProjection": False
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["value"])
        print(f"  {year}: {len(year_data)} países")

    # Build timeseries
    for iso2_code in exports_data:
        iso3_code = ISO2_TO_ISO3.get(iso2_code)
        if iso3_code not in COUNTRY_NAMES:
            continue

        series = []
        for year in sorted(years):
            exports = exports_data.get(iso2_code, {}).get(year)
            imports = imports_data.get(iso2_code, {}).get(year)

            if exports is not None and imports is not None:
                try:
                    balance = round(exports - imports, 0)
                    series.append({
                        "year": year,
                        "value": balance,
                        "exports": round(exports, 0),
                        "imports": round(imports, 0),
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
        data = fetch_trade_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ Datos guardados en: {OUTPUT_FILE}")
        print(f"✓ Total años: {len(data['data'])}")
        print(f"✓ Total países: {len(data['timeseries'])}")

        latest_year = data["metadata"]["last_real_year"]
        if latest_year in data["data"]:
            print(f"\nTop 10 superávit comercial ({latest_year}):")
            for i, country in enumerate(data["data"][latest_year][:10], 1):
                print(f"  {i}. {country['country']}: ${country['value']/1e9:.1f}B")

            print(f"\nTop 10 déficit comercial ({latest_year}):")
            deficit = sorted(data["data"][latest_year], key=lambda x: x["value"])[:10]
            for i, country in enumerate(deficit, 1):
                print(f"  {i}. {country['country']}: ${country['value']/1e9:.1f}B")

    except requests.RequestException as e:
        print(f"Error de conexión: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
