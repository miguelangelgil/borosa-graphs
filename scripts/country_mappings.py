"""
Mapeos de países compartidos entre todos los scripts de datos
"""

from datetime import datetime

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
    "MKD": "Macedonia N.", "MNE": "Montenegro",
    # Agregados económicos
    "EMU": "Zona Euro", "EUQ": "Unión Europea"
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
    "SRB": "Europa", "ALB": "Europa", "MKD": "Europa", "MNE": "Europa",
    # Agregados económicos
    "EMU": "Europa", "EUQ": "Europa"
}

# ISO3 to ISO2 mapping for World Bank API
ISO3_TO_ISO2 = {
    "JPN": "JP", "USA": "US", "CHN": "CN", "DEU": "DE", "GBR": "GB",
    "FRA": "FR", "ITA": "IT", "ESP": "ES", "BRA": "BR", "IND": "IN",
    "RUS": "RU", "CAN": "CA", "AUS": "AU", "MEX": "MX", "KOR": "KR",
    "IDN": "ID", "TUR": "TR", "SAU": "SA", "ARG": "AR", "ZAF": "ZA",
    "NLD": "NL", "CHE": "CH", "POL": "PL", "BEL": "BE", "SWE": "SE",
    "AUT": "AT", "NOR": "NO", "IRL": "IE", "SGP": "SG", "PRT": "PT",
    "GRC": "GR", "DNK": "DK", "FIN": "FI", "CHL": "CL", "COL": "CO",
    "PER": "PE", "EGY": "EG", "PAK": "PK", "THA": "TH", "MYS": "MY",
    "PHL": "PH", "VNM": "VN", "BGD": "BD", "NGA": "NG", "KEN": "KE",
    "MAR": "MA", "UKR": "UA", "CZE": "CZ", "ROU": "RO", "HUN": "HU",
    "NZL": "NZ", "ISR": "IL", "ARE": "AE", "QAT": "QA", "KWT": "KW",
    "VEN": "VE", "LBN": "LB", "SDN": "SD", "JAM": "JM", "LKA": "LK",
    "JOR": "JO", "HRV": "HR", "SVK": "SK", "SVN": "SI", "LTU": "LT",
    "LVA": "LV", "EST": "EE", "ISL": "IS", "LUX": "LU", "CYP": "CY",
    "MLT": "MT", "IRN": "IR", "IRQ": "IQ", "OMN": "OM", "BHR": "BH",
    "TWN": "TW", "URY": "UY", "ECU": "EC", "BOL": "BO", "PRY": "PY",
    "PAN": "PA", "CRI": "CR", "GTM": "GT", "DOM": "DO", "HND": "HN",
    "SLV": "SV", "NIC": "NI", "GHA": "GH", "TZA": "TZ", "ETH": "ET",
    "UGA": "UG", "MOZ": "MZ", "ZMB": "ZM", "BWA": "BW", "MUS": "MU",
    "SEN": "SN", "CIV": "CI", "CMR": "CM", "AGO": "AO", "DZA": "DZ",
    "TUN": "TN", "NPL": "NP", "KHM": "KH", "MDA": "MD", "GEO": "GE",
    "ARM": "AM", "AZE": "AZ", "KAZ": "KZ", "UZB": "UZ", "BLR": "BY",
    "SRB": "RS", "ALB": "AL", "MKD": "MK", "MNE": "ME",
    # Agregados económicos (World Bank usa códigos diferentes)
    "EMU": "XC", "EUQ": "EU"
}
