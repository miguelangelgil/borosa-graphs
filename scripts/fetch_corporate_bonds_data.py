"""
Corporate Bond Yields Data Fetcher
Fetches Investment Grade and High Yield corporate bond indices from FRED
"""

import requests
import json
import os
from datetime import datetime
from country_mappings import CURRENT_YEAR

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "..", "data", "corporate_bonds_data.json")

# FRED series for corporate bonds by region
FRED_SERIES = {
    # === NORTH AMERICA (US) ===
    # Investment Grade
    "US_IG": {
        "series_id": "BAMLC0A0CMEY",
        "name": "US Investment Grade",
        "category": "Investment Grade",
        "region": "North America",
        "description": "ICE BofA US Corporate Index Effective Yield"
    },
    "US_IG_AAA": {
        "series_id": "AAA",
        "name": "US AAA Rated",
        "category": "Investment Grade",
        "region": "North America",
        "description": "Moody's Seasoned Aaa Corporate Bond Yield"
    },
    "US_IG_BAA": {
        "series_id": "BAA",
        "name": "US BAA Rated",
        "category": "Investment Grade",
        "region": "North America",
        "description": "Moody's Seasoned Baa Corporate Bond Yield"
    },
    # High Yield
    "US_HY": {
        "series_id": "BAMLH0A0HYM2EY",
        "name": "US High Yield",
        "category": "High Yield",
        "region": "North America",
        "description": "ICE BofA US High Yield Index Effective Yield"
    },
    "US_HY_BB": {
        "series_id": "BAMLH0A1HYBBEY",
        "name": "US BB Rated",
        "category": "High Yield",
        "region": "North America",
        "description": "ICE BofA BB US High Yield Index Effective Yield"
    },
    "US_HY_B": {
        "series_id": "BAMLH0A2HYBEY",
        "name": "US B Rated",
        "category": "High Yield",
        "region": "North America",
        "description": "ICE BofA Single-B US High Yield Index Effective Yield"
    },
    "US_HY_CCC": {
        "series_id": "BAMLH0A3HYCEY",
        "name": "US CCC & Below",
        "category": "High Yield",
        "region": "North America",
        "description": "ICE BofA CCC & Lower US High Yield Index Effective Yield"
    },

    # === EUROPE ===
    "EU_HY": {
        "series_id": "BAMLHE00EHYIEY",
        "name": "Euro High Yield",
        "category": "High Yield",
        "region": "Europe",
        "description": "ICE BofA Euro High Yield Index Effective Yield"
    },
    "EU_IG": {
        "series_id": "BAMLC0A4CBBBEY",
        "name": "Euro Investment Grade",
        "category": "Investment Grade",
        "region": "Europe",
        "description": "ICE BofA BBB US Corporate Index Effective Yield (proxy)"
    },

    # === EMERGING MARKETS (Global) ===
    "EM_TOTAL": {
        "series_id": "BAMLEMCBPIEY",
        "name": "Emerging Markets Total",
        "category": "Investment Grade",
        "region": "Emerging Markets",
        "description": "ICE BofA Emerging Markets Corporate Plus Index Effective Yield"
    },
    "EM_HY": {
        "series_id": "BAMLEMHBHYCRPIEY",
        "name": "Emerging Markets HY",
        "category": "High Yield",
        "region": "Emerging Markets",
        "description": "ICE BofA High Yield Emerging Markets Corporate Plus Index Effective Yield"
    },

    # === ASIA ===
    "ASIA_EM": {
        "series_id": "BAMLEMRACRPIASIAEY",
        "name": "Asia EM Corporate",
        "category": "Investment Grade",
        "region": "Asia",
        "description": "ICE BofA Asia Emerging Markets Corporate Plus Index Effective Yield"
    },

    # === EMEA (Europe, Middle East, Africa) ===
    "EMEA_EM": {
        "series_id": "BAMLEMRECRPIEMEAEY",
        "name": "EMEA EM Corporate",
        "category": "Investment Grade",
        "region": "EMEA",
        "description": "ICE BofA EMEA Emerging Markets Corporate Plus Index Effective Yield"
    },

    # === LATIN AMERICA ===
    "LATAM_EM": {
        "series_id": "BAMLEMRLCRPILAEY",
        "name": "Latin America EM Corporate",
        "category": "Investment Grade",
        "region": "Latin America",
        "description": "ICE BofA Latin America Emerging Markets Corporate Plus Index Effective Yield"
    },

    # === SPREADS (for comparison) ===
    "US_SPREAD_IG": {
        "series_id": "BAMLC0A0CM",
        "name": "US IG Spread",
        "category": "Spreads",
        "region": "North America",
        "description": "ICE BofA US Corporate Index Option-Adjusted Spread"
    },
    "US_SPREAD_HY": {
        "series_id": "BAMLH0A0HYM2",
        "name": "US HY Spread",
        "category": "Spreads",
        "region": "North America",
        "description": "ICE BofA US High Yield Index Option-Adjusted Spread"
    },
    "EU_SPREAD_HY": {
        "series_id": "BAMLHE00EHYIOAS",
        "name": "Euro HY Spread",
        "category": "Spreads",
        "region": "Europe",
        "description": "ICE BofA Euro High Yield Index Option-Adjusted Spread"
    },
    "EM_SPREAD": {
        "series_id": "BAMLEMCBPIOAS",
        "name": "EM Corporate Spread",
        "category": "Spreads",
        "region": "Emerging Markets",
        "description": "ICE BofA Emerging Markets Corporate Plus Index Option-Adjusted Spread"
    }
}


def fetch_fred_series(series_id):
    """Fetch data from FRED text file"""
    url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        lines = response.text.strip().split('\n')
        if len(lines) < 2:
            return None

        # Parse CSV (skip header)
        data = []
        for line in lines[1:]:
            parts = line.split(',')
            if len(parts) >= 2:
                date = parts[0]
                value = parts[1]
                if value and value != '.':
                    try:
                        data.append({
                            "date": date,
                            "value": round(float(value), 3)
                        })
                    except ValueError:
                        continue

        return data
    except Exception as e:
        print(f"  Error fetching {series_id}: {e}")
        return None


def fetch_corporate_bonds_data():
    print("Downloading Corporate Bond Yields data from FRED...")

    # Collect all unique regions
    regions = list(set(info["region"] for info in FRED_SERIES.values()))
    regions.sort()

    result = {
        "metadata": {
            "source": "FRED (Federal Reserve Economic Data)",
            "indicator": "ICE BofA Corporate Bond Indices",
            "description": "Corporate Bond Yields by Region - Investment Grade and High Yield",
            "fetched_at": datetime.now().isoformat(),
            "categories": ["Investment Grade", "High Yield", "Spreads"],
            "regions": regions
        },
        "current": {
            "Investment Grade": [],
            "High Yield": [],
            "Spreads": []
        },
        "timeseries": {}
    }

    for code, info in FRED_SERIES.items():
        print(f"  Fetching {info['name']} ({info['series_id']})...")

        data = fetch_fred_series(info['series_id'])

        if data and len(data) > 0:
            # Get latest value
            latest = data[-1]

            # Add to current data
            result["current"][info["category"]].append({
                "code": code,
                "name": info["name"],
                "value": latest["value"],
                "date": latest["date"],
                "region": info["region"],
                "description": info["description"]
            })

            # Add timeseries (last 25 years of monthly data)
            # Filter to get one value per month (last available)
            monthly_data = {}
            for d in data:
                year_month = d["date"][:7]  # YYYY-MM
                year = int(d["date"][:4])
                if year >= CURRENT_YEAR - 25:
                    monthly_data[year_month] = d

            # Convert to list sorted by date
            timeseries_data = [monthly_data[k] for k in sorted(monthly_data.keys())]

            result["timeseries"][code] = {
                "name": info["name"],
                "category": info["category"],
                "region": info["region"],
                "description": info["description"],
                "data": timeseries_data[-300:]  # Last 300 months (25 years)
            }

            print(f"    Latest: {latest['value']}% ({latest['date']})")
        else:
            print(f"    No data available")

    # Sort current data by value
    for category in result["current"]:
        result["current"][category] = sorted(
            result["current"][category],
            key=lambda x: -x["value"]
        )

    return result


def main():
    try:
        data = fetch_corporate_bonds_data()

        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {OUTPUT_FILE}")
        print(f"Total series: {len(data['timeseries'])}")

        print("\nCurrent Yields:")
        for category, items in data["current"].items():
            print(f"\n  {category}:")
            for item in items:
                print(f"    {item['name']}: {item['value']}%")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
