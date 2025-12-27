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

# FRED series for corporate bonds
FRED_SERIES = {
    # Investment Grade
    "IG_US": {
        "series_id": "BAMLC0A0CMEY",
        "name": "US Investment Grade",
        "category": "Investment Grade",
        "description": "ICE BofA US Corporate Index Effective Yield"
    },
    "IG_AAA": {
        "series_id": "AAA",
        "name": "AAA Rated",
        "category": "Investment Grade",
        "description": "Moody's Seasoned Aaa Corporate Bond Yield"
    },
    "IG_BAA": {
        "series_id": "BAA",
        "name": "BAA Rated",
        "category": "Investment Grade",
        "description": "Moody's Seasoned Baa Corporate Bond Yield"
    },
    # High Yield
    "HY_US": {
        "series_id": "BAMLH0A0HYM2EY",
        "name": "US High Yield",
        "category": "High Yield",
        "description": "ICE BofA US High Yield Index Effective Yield"
    },
    "HY_BB": {
        "series_id": "BAMLH0A1HYBBEY",
        "name": "BB Rated",
        "category": "High Yield",
        "description": "ICE BofA BB US High Yield Index Effective Yield"
    },
    "HY_B": {
        "series_id": "BAMLH0A2HYBEY",
        "name": "B Rated",
        "category": "High Yield",
        "description": "ICE BofA Single-B US High Yield Index Effective Yield"
    },
    "HY_CCC": {
        "series_id": "BAMLH0A3HYCEY",
        "name": "CCC & Below",
        "category": "High Yield",
        "description": "ICE BofA CCC & Lower US High Yield Index Effective Yield"
    },
    # Spreads
    "SPREAD_IG": {
        "series_id": "BAMLC0A0CM",
        "name": "IG Spread",
        "category": "Spreads",
        "description": "ICE BofA US Corporate Index Option-Adjusted Spread"
    },
    "SPREAD_HY": {
        "series_id": "BAMLH0A0HYM2",
        "name": "HY Spread",
        "category": "Spreads",
        "description": "ICE BofA US High Yield Index Option-Adjusted Spread"
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

    result = {
        "metadata": {
            "source": "FRED (Federal Reserve Economic Data)",
            "indicator": "ICE BofA Corporate Bond Indices",
            "description": "US Corporate Bond Yields - Investment Grade and High Yield",
            "fetched_at": datetime.now().isoformat(),
            "categories": ["Investment Grade", "High Yield", "Spreads"]
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
