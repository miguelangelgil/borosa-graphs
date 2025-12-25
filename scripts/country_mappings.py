"""
Shared country mappings for all data scripts
"""

from datetime import datetime

CURRENT_YEAR = datetime.now().year

# ISO code to country name mapping (English)
COUNTRY_NAMES = {
    "JPN": "Japan", "USA": "USA", "CHN": "China", "DEU": "Germany",
    "GBR": "United Kingdom", "FRA": "France", "ITA": "Italy", "ESP": "Spain",
    "BRA": "Brazil", "IND": "India", "RUS": "Russia", "CAN": "Canada",
    "AUS": "Australia", "MEX": "Mexico", "KOR": "South Korea", "IDN": "Indonesia",
    "TUR": "Turkey", "SAU": "Saudi Arabia", "ARG": "Argentina", "ZAF": "South Africa",
    "NLD": "Netherlands", "CHE": "Switzerland", "POL": "Poland", "BEL": "Belgium",
    "SWE": "Sweden", "AUT": "Austria", "NOR": "Norway", "IRL": "Ireland",
    "SGP": "Singapore", "PRT": "Portugal", "GRC": "Greece", "DNK": "Denmark",
    "FIN": "Finland", "CHL": "Chile", "COL": "Colombia", "PER": "Peru",
    "EGY": "Egypt", "PAK": "Pakistan", "THA": "Thailand", "MYS": "Malaysia",
    "PHL": "Philippines", "VNM": "Vietnam", "BGD": "Bangladesh", "NGA": "Nigeria",
    "KEN": "Kenya", "MAR": "Morocco", "UKR": "Ukraine", "CZE": "Czechia",
    "ROU": "Romania", "HUN": "Hungary", "NZL": "New Zealand", "ISR": "Israel",
    "ARE": "UAE", "QAT": "Qatar", "KWT": "Kuwait", "VEN": "Venezuela",
    "LBN": "Lebanon", "SDN": "Sudan", "JAM": "Jamaica", "LKA": "Sri Lanka",
    "JOR": "Jordan", "HRV": "Croatia", "SVK": "Slovakia", "SVN": "Slovenia",
    "LTU": "Lithuania", "LVA": "Latvia", "EST": "Estonia", "ISL": "Iceland",
    "LUX": "Luxembourg", "CYP": "Cyprus", "MLT": "Malta", "IRN": "Iran",
    "IRQ": "Iraq", "OMN": "Oman", "BHR": "Bahrain", "TWN": "Taiwan",
    "URY": "Uruguay", "ECU": "Ecuador", "BOL": "Bolivia", "PRY": "Paraguay",
    "PAN": "Panama", "CRI": "Costa Rica", "GTM": "Guatemala", "DOM": "Dominican Rep.",
    "HND": "Honduras", "SLV": "El Salvador", "NIC": "Nicaragua", "GHA": "Ghana",
    "TZA": "Tanzania", "ETH": "Ethiopia", "UGA": "Uganda", "MOZ": "Mozambique",
    "ZMB": "Zambia", "BWA": "Botswana", "MUS": "Mauritius", "SEN": "Senegal",
    "CIV": "Ivory Coast", "CMR": "Cameroon", "AGO": "Angola", "DZA": "Algeria",
    "TUN": "Tunisia", "NPL": "Nepal", "KHM": "Cambodia", "MDA": "Moldova",
    "GEO": "Georgia", "ARM": "Armenia", "AZE": "Azerbaijan", "KAZ": "Kazakhstan",
    "UZB": "Uzbekistan", "BLR": "Belarus", "SRB": "Serbia", "ALB": "Albania",
    "MKD": "North Macedonia", "MNE": "Montenegro",
    # Economic aggregates
    "EMU": "Eurozone", "EUQ": "European Union"
}

# Region mapping
REGIONS = {
    "JPN": "Asia", "USA": "Americas", "CHN": "Asia", "DEU": "Europe", "GBR": "Europe",
    "FRA": "Europe", "ITA": "Europe", "ESP": "Europe", "BRA": "Latam", "IND": "Asia",
    "RUS": "Europe", "CAN": "Americas", "AUS": "Oceania", "MEX": "Latam", "KOR": "Asia",
    "IDN": "Asia", "TUR": "Europe", "SAU": "MENA", "ARG": "Latam", "ZAF": "Africa",
    "NLD": "Europe", "CHE": "Europe", "POL": "Europe", "BEL": "Europe", "SWE": "Europe",
    "AUT": "Europe", "NOR": "Europe", "IRL": "Europe", "SGP": "Asia", "PRT": "Europe",
    "GRC": "Europe", "DNK": "Europe", "FIN": "Europe", "CHL": "Latam", "COL": "Latam",
    "PER": "Latam", "EGY": "MENA", "PAK": "Asia", "THA": "Asia", "MYS": "Asia",
    "PHL": "Asia", "VNM": "Asia", "BGD": "Asia", "NGA": "Africa", "KEN": "Africa",
    "MAR": "MENA", "UKR": "Europe", "CZE": "Europe", "ROU": "Europe", "HUN": "Europe",
    "NZL": "Oceania", "ISR": "MENA", "ARE": "MENA", "QAT": "MENA", "KWT": "MENA",
    "VEN": "Latam", "LBN": "MENA", "SDN": "Africa", "JAM": "Latam", "LKA": "Asia",
    "JOR": "MENA", "HRV": "Europe", "SVK": "Europe", "SVN": "Europe", "LTU": "Europe",
    "LVA": "Europe", "EST": "Europe", "ISL": "Europe", "LUX": "Europe", "CYP": "Europe",
    "MLT": "Europe", "IRN": "MENA", "IRQ": "MENA", "OMN": "MENA", "BHR": "MENA",
    "TWN": "Asia", "URY": "Latam", "ECU": "Latam", "BOL": "Latam", "PRY": "Latam",
    "PAN": "Latam", "CRI": "Latam", "GTM": "Latam", "DOM": "Latam", "HND": "Latam",
    "SLV": "Latam", "NIC": "Latam", "GHA": "Africa", "TZA": "Africa", "ETH": "Africa",
    "UGA": "Africa", "MOZ": "Africa", "ZMB": "Africa", "BWA": "Africa", "MUS": "Africa",
    "SEN": "Africa", "CIV": "Africa", "CMR": "Africa", "AGO": "Africa", "DZA": "MENA",
    "TUN": "MENA", "NPL": "Asia", "KHM": "Asia", "MDA": "Europe", "GEO": "Europe",
    "ARM": "Europe", "AZE": "Europe", "KAZ": "Asia", "UZB": "Asia", "BLR": "Europe",
    "SRB": "Europe", "ALB": "Europe", "MKD": "Europe", "MNE": "Europe",
    # Economic aggregates
    "EMU": "Europe", "EUQ": "Europe"
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
