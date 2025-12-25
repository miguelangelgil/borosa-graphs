"""
Descargador de datos de Desempleo del FMI DataMapper
Indicador: LUR (Unemployment rate, % of labor force)
"""

import requests
import json
import os
from datetime import datetime
from country_mappings import COUNTRY_NAMES, REGIONS, CURRENT_YEAR

IMF_URL = "https://www.imf.org/external/datamapper/api/v1/LUR"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "employment_data.json")


def fetch_employment_data():
    print("Descargando datos de Desempleo del FMI...")
    print(f"URL: {IMF_URL}\n")

    response = requests.get(IMF_URL, timeout=30)
    response.raise_for_status()

    data = response.json()
    employment_data = data.get("values", {}).get("LUR", {})

    if not employment_data:
        raise ValueError("No se encontraron datos en la respuesta")

    all_years = set()
    for country_data in employment_data.values():
        all_years.update(country_data.keys())

    years = sorted([y for y in all_years if y.isdigit()], reverse=True)

    real_years = [y for y in years if int(y) <= CURRENT_YEAR]
    projection_years = [y for y in years if int(y) > CURRENT_YEAR]

    print(f"Años con datos reales: {real_years[-1] if real_years else 'N/A'} - {real_years[0] if real_years else 'N/A'}")
    print(f"Años con proyecciones: {projection_years[-1] if projection_years else 'N/A'} - {projection_years[0] if projection_years else 'N/A'}")

    result = {
        "metadata": {
            "source": "IMF DataMapper",
            "indicator": "LUR",
            "description": "Unemployment rate (% of labor force)",
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
        for code, values in employment_data.items():
            if code not in COUNTRY_NAMES:
                continue
            value = values.get(year)
            if value is None:
                continue
            try:
                unemployment_rate = round(float(value), 2)
                year_data.append({
                    "code": code,
                    "country": COUNTRY_NAMES[code],
                    "value": unemployment_rate,
                    "region": REGIONS.get(code, "Otro"),
                    "isProjection": int(year) > CURRENT_YEAR
                })
            except (ValueError, TypeError):
                continue

        result["data"][year] = sorted(year_data, key=lambda x: -x["value"])
        print(f"  {year}: {len(year_data)} países {'(proyección)' if int(year) > CURRENT_YEAR else ''}")

    for code, values in employment_data.items():
        if code not in COUNTRY_NAMES:
            continue

        series = []
        for year in sorted(years[:25]):
            value = values.get(year)
            if value is not None:
                try:
                    series.append({
                        "year": year,
                        "value": round(float(value), 2),
                        "isProjection": int(year) > CURRENT_YEAR
                    })
                except (ValueError, TypeError):
                    continue

        if series:
            result["timeseries"][code] = {
                "country": COUNTRY_NAMES[code],
                "region": REGIONS.get(code, "Otro"),
                "data": series
            }

    return result


def main():
    try:
        data = fetch_employment_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ Datos guardados en: {OUTPUT_FILE}")
        print(f"✓ Total años: {len(data['data'])}")
        print(f"✓ Total países: {len(data['timeseries'])}")

        latest_year = data["metadata"]["last_real_year"]
        print(f"\nTop 10 países con mayor desempleo ({latest_year}):")
        for i, country in enumerate(data["data"][latest_year][:10], 1):
            print(f"  {i}. {country['country']}: {country['value']}%")

    except requests.RequestException as e:
        print(f"Error de conexión: {e}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
