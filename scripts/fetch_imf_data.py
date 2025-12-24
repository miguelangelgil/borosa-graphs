"""
Descargador de datos de Deuda/PIB del FMI DataMapper
Ejecutar: python imf_debt_fetcher.py
Genera: data/imf_debt_data.json
"""

import requests
import json
from datetime import datetime

# Configuración
IMF_URL = "https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP"
OUTPUT_FILE = "data/imf_debt_data.json"
CURRENT_YEAR = datetime.now().year

# Mapeo de códigos ISO a nombres en español
COUNTRY_NAMES = {
    "JPN": "Japón", "USA": "EE.UU.", "CHN": "China", "DEU": "Alemania", 
    "GBR": "Reino Unido", "FRA": "Francia", "ITA": "Italia", "ESP": "España", 
    "BRA": "Brasil", "IND": "India", "RUS": "Rusia", "CAN": "Canadá", 
    "AUS": "Australia", "MEX": "México", "KOR": "Corea Sur", "IDN": "Indonesia", 
    "TUR": "Turquía", "SAU": "Arabia Saudí", "ARG": "Argentina", "ZAF": "Sudáfrica", 
    "NLD": "Países Bajos", "CHE": "Suiza", "POL": "Polonia", "BEL": "Bélgica", 
    "SWE": "Suecia", "AUT": "Austria", "NOR": "Noruega", "IRL": "Irlanda", 
    "SGP": "Singapur", "PRT": "Portugal", "GRC": "Grecia", "DNK": "Dinamarca", 
    "FIN": "Finlandia", "CHL": "Chile", "COL": "Colombia", "PER": "Perú", 
    "EGY": "Egipto", "PAK": "Pakistán", "THA": "Tailandia", "MYS": "Malasia", 
    "PHL": "Filipinas", "VNM": "Vietnam", "BGD": "Bangladesh", "NGA": "Nigeria", 
    "KEN": "Kenia", "MAR": "Marruecos", "UKR": "Ucrania", "CZE": "Chequia", 
    "ROU": "Rumanía", "HUN": "Hungría", "NZL": "Nueva Zelanda", "ISR": "Israel", 
    "ARE": "Emiratos", "QAT": "Qatar", "KWT": "Kuwait", "VEN": "Venezuela", 
    "LBN": "Líbano", "SDN": "Sudán", "JAM": "Jamaica", "LKA": "Sri Lanka", 
    "JOR": "Jordania", "HRV": "Croacia", "SVK": "Eslovaquia", "SVN": "Eslovenia", 
    "LTU": "Lituania", "LVA": "Letonia", "EST": "Estonia", "ISL": "Islandia", 
    "LUX": "Luxemburgo", "CYP": "Chipre", "MLT": "Malta", "IRN": "Irán", 
    "IRQ": "Iraq", "OMN": "Omán", "BHR": "Bahréin", "TWN": "Taiwán",
    "URY": "Uruguay", "ECU": "Ecuador", "BOL": "Bolivia", "PRY": "Paraguay", 
    "PAN": "Panamá", "CRI": "Costa Rica", "GTM": "Guatemala", "DOM": "Rep. Dominicana",
    "HND": "Honduras", "SLV": "El Salvador", "NIC": "Nicaragua", "GHA": "Ghana",
    "TZA": "Tanzania", "ETH": "Etiopía", "UGA": "Uganda", "MOZ": "Mozambique",
    "ZMB": "Zambia", "BWA": "Botsuana", "MUS": "Mauricio", "SEN": "Senegal",
    "CIV": "Costa Marfil", "CMR": "Camerún", "AGO": "Angola", "DZA": "Argelia",
    "TUN": "Túnez", "NPL": "Nepal", "KHM": "Camboya", "MDA": "Moldavia", 
    "GEO": "Georgia", "ARM": "Armenia", "AZE": "Azerbaiyán", "KAZ": "Kazajistán",
    "UZB": "Uzbekistán", "BLR": "Bielorrusia", "SRB": "Serbia", "ALB": "Albania",
    "MKD": "Macedonia N.", "MNE": "Montenegro"
}

# Mapeo de regiones
REGIONS = {
    "JPN": "Asia", "USA": "América", "CHN": "Asia", "DEU": "Europa", "GBR": "Europa",
    "FRA": "Europa", "ITA": "Europa", "ESP": "Europa", "BRA": "Latam", "IND": "Asia",
    "RUS": "Europa", "CAN": "América", "AUS": "Oceanía", "MEX": "Latam", "KOR": "Asia",
    "IDN": "Asia", "TUR": "Europa", "SAU": "MENA", "ARG": "Latam", "ZAF": "África",
    "NLD": "Europa", "CHE": "Europa", "POL": "Europa", "BEL": "Europa", "SWE": "Europa",
    "AUT": "Europa", "NOR": "Europa", "IRL": "Europa", "SGP": "Asia", "PRT": "Europa",
    "GRC": "Europa", "DNK": "Europa", "FIN": "Europa", "CHL": "Latam", "COL": "Latam",
    "PER": "Latam", "EGY": "MENA", "PAK": "Asia", "THA": "Asia", "MYS": "Asia",
    "PHL": "Asia", "VNM": "Asia", "BGD": "Asia", "NGA": "África", "KEN": "África",
    "MAR": "MENA", "UKR": "Europa", "CZE": "Europa", "ROU": "Europa", "HUN": "Europa",
    "NZL": "Oceanía", "ISR": "MENA", "ARE": "MENA", "QAT": "MENA", "KWT": "MENA",
    "VEN": "Latam", "LBN": "MENA", "SDN": "África", "JAM": "Latam", "LKA": "Asia",
    "JOR": "MENA", "HRV": "Europa", "SVK": "Europa", "SVN": "Europa", "LTU": "Europa",
    "LVA": "Europa", "EST": "Europa", "ISL": "Europa", "LUX": "Europa", "CYP": "Europa",
    "MLT": "Europa", "IRN": "MENA", "IRQ": "MENA", "OMN": "MENA", "BHR": "MENA", 
    "TWN": "Asia", "URY": "Latam", "ECU": "Latam", "BOL": "Latam", "PRY": "Latam",
    "PAN": "Latam", "CRI": "Latam", "GTM": "Latam", "DOM": "Latam", "HND": "Latam",
    "SLV": "Latam", "NIC": "Latam", "GHA": "África", "TZA": "África", "ETH": "África",
    "UGA": "África", "MOZ": "África", "ZMB": "África", "BWA": "África", "MUS": "África",
    "SEN": "África", "CIV": "África", "CMR": "África", "AGO": "África", "DZA": "MENA",
    "TUN": "MENA", "NPL": "Asia", "KHM": "Asia", "MDA": "Europa", "GEO": "Europa",
    "ARM": "Europa", "AZE": "Europa", "KAZ": "Asia", "UZB": "Asia", "BLR": "Europa",
    "SRB": "Europa", "ALB": "Europa", "MKD": "Europa", "MNE": "Europa"
}

def fetch_imf_data():
    print(f"Descargando datos del FMI...")
    print(f"URL: {IMF_URL}\n")
    
    response = requests.get(IMF_URL, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    debt_data = data.get("values", {}).get("GGXWDG_NGDP", {})
    
    if not debt_data:
        raise ValueError("No se encontraron datos en la respuesta")
    
    # Obtener años disponibles
    all_years = set()
    for country_data in debt_data.values():
        all_years.update(country_data.keys())
    
    years = sorted([y for y in all_years if y.isdigit()], reverse=True)
    
    # Separar años reales de proyecciones
    real_years = [y for y in years if int(y) <= CURRENT_YEAR]
    projection_years = [y for y in years if int(y) > CURRENT_YEAR]
    
    print(f"Años con datos reales: {real_years[0]} - {real_years[-1]}")
    print(f"Años con proyecciones: {projection_years[-1] if projection_years else 'N/A'} - {projection_years[0] if projection_years else 'N/A'}")
    
    # Procesar datos por año
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
    
    # Datos por año (para gráfico de barras)
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
                    "region": REGIONS.get(code, "Otro"),
                    "isProjection": int(year) > CURRENT_YEAR
                })
            except (ValueError, TypeError):
                continue
        
        result["data"][year] = sorted(year_data, key=lambda x: -x["debt"])
        print(f"  {year}: {len(year_data)} países {'(proyección)' if int(year) > CURRENT_YEAR else ''}")
    
    # Series temporales por país (para gráfico de líneas)
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
                "region": REGIONS.get(code, "Otro"),
                "data": series
            }
    
    return result

def main():
    try:
        data = fetch_imf_data()
        
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✓ Datos guardados en: {OUTPUT_FILE}")
        print(f"✓ Total años: {len(data['data'])}")
        print(f"✓ Total países con series temporales: {len(data['timeseries'])}")
        
        # Mostrar top 10 del año más reciente real
        latest_year = data["metadata"]["last_real_year"]
        print(f"\nTop 10 países con mayor deuda/PIB ({latest_year}):")
        for i, country in enumerate(data["data"][latest_year][:10], 1):
            print(f"  {i}. {country['country']}: {country['debt']}%")
            
    except requests.RequestException as e:
        print(f"Error de conexión: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()