"""
Generic Futures and Options Volume Data Fetcher
Fetches futures prices and real options data from Yahoo Finance and COT data from CFTC
"""

import json
import os
from datetime import datetime
import pandas as pd

try:
    import yfinance as yf
    import requests
except ImportError:
    print("Installing dependencies...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'yfinance', 'requests'])
    import yfinance as yf
    import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# CFTC COT Report API
CFTC_API_BASE = "https://publicreporting.cftc.gov/resource"


def fetch_cot_data(cftc_code, instrument_name):
    """
    Fetch Commitment of Traders (COT) data from CFTC
    Returns weekly positioning data by trader type
    """
    if not cftc_code:
        print(f"No CFTC code provided for {instrument_name}, skipping COT data")
        return []

    print(f"Fetching COT Report data from CFTC for {instrument_name}...")

    try:
        # Fetch disaggregated futures and options combined report
        url = f"{CFTC_API_BASE}/6dca-aqww.json"
        params = {
            "$where": f"cftc_contract_market_code='{cftc_code}'",
            "$order": "report_date_as_yyyy_mm_dd DESC",
            "$limit": 52
        }

        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()

        cot_data = response.json()

        if not cot_data:
            print("No COT data returned")
            return []

        print(f"Retrieved {len(cot_data)} weeks of COT data")

        # Parse and format COT data
        formatted_data = []
        for record in reversed(cot_data):
            try:
                formatted_data.append({
                    "date": record.get("report_date_as_yyyy_mm_dd"),
                    "commercial_long": int(record.get("comm_positions_long_all", 0)),
                    "commercial_short": int(record.get("comm_positions_short_all", 0)),
                    "non_commercial_long": int(record.get("noncomm_positions_long_all", 0)),
                    "non_commercial_short": int(record.get("noncomm_positions_short_all", 0)),
                    "non_reportable_long": int(record.get("nonrept_positions_long_all", 0)),
                    "non_reportable_short": int(record.get("nonrept_positions_short_all", 0)),
                    "open_interest": int(record.get("open_interest_all", 0))
                })
            except (KeyError, ValueError, TypeError) as e:
                print(f"Error parsing record: {e}")
                continue

        return formatted_data

    except requests.RequestException as e:
        print(f"Error fetching COT data: {e}")
        return []
    except Exception as e:
        print(f"Unexpected error: {e}")
        return []


def fetch_futures_prices(futures_symbol, instrument_name):
    """Fetch historical futures prices"""
    print(f"Fetching {instrument_name} futures prices from Yahoo Finance...")

    try:
        # Fetch 6 months of data
        ticker = yf.Ticker(futures_symbol)
        hist = ticker.history(period="6mo")

        if hist.empty:
            print("No data returned from Yahoo Finance")
            return None, None

        # Get current price
        current_price = hist['Close'].iloc[-1]
        print(f"Current {instrument_name} price: ${current_price:.2f}")

        # Format historical data
        price_history = []
        for date, row in hist.iterrows():
            price_history.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row['Open']), 2),
                "high": round(float(row['High']), 2),
                "low": round(float(row['Low']), 2),
                "close": round(float(row['Close']), 2),
                "volume": int(row['Volume']) if row['Volume'] else 0
            })

        return current_price, price_history

    except Exception as e:
        print(f"Error fetching {instrument_name} prices: {e}")
        return None, None


def fetch_real_options_data(etf_symbol, instrument_name):
    """
    Fetch real options data from Yahoo Finance
    Returns options chain data for the given ETF
    """
    print(f"Fetching real options data for {etf_symbol} ({instrument_name}) from Yahoo Finance...")

    try:
        ticker = yf.Ticker(etf_symbol)

        # Get available expiration dates
        expirations = ticker.options

        if not expirations:
            print("No options expiration dates found")
            return []

        print(f"Found {len(expirations)} expiration dates")

        all_options_data = []

        # Fetch options for multiple expiration dates (up to 12)
        for expiration in expirations[:12]:
            try:
                print(f"Fetching options for expiration: {expiration}")
                opt_chain = ticker.option_chain(expiration)

                # Process calls
                if not opt_chain.calls.empty:
                    for _, row in opt_chain.calls.iterrows():
                        all_options_data.append({
                            "expiration": expiration,
                            "strike": float(row['strike']),
                            "type": "call",
                            "volume": int(row['volume']) if pd.notna(row['volume']) else 0,
                            "open_interest": int(row['openInterest']) if pd.notna(row['openInterest']) else 0,
                            "bid": float(row['bid']) if pd.notna(row['bid']) else 0,
                            "ask": float(row['ask']) if pd.notna(row['ask']) else 0,
                            "last_price": float(row['lastPrice']) if pd.notna(row['lastPrice']) else 0,
                            "implied_volatility": float(row['impliedVolatility']) if pd.notna(row['impliedVolatility']) else 0
                        })

                # Process puts
                if not opt_chain.puts.empty:
                    for _, row in opt_chain.puts.iterrows():
                        all_options_data.append({
                            "expiration": expiration,
                            "strike": float(row['strike']),
                            "type": "put",
                            "volume": int(row['volume']) if pd.notna(row['volume']) else 0,
                            "open_interest": int(row['openInterest']) if pd.notna(row['openInterest']) else 0,
                            "bid": float(row['bid']) if pd.notna(row['bid']) else 0,
                            "ask": float(row['ask']) if pd.notna(row['ask']) else 0,
                            "last_price": float(row['lastPrice']) if pd.notna(row['lastPrice']) else 0,
                            "implied_volatility": float(row['impliedVolatility']) if pd.notna(row['impliedVolatility']) else 0
                        })

            except Exception as e:
                print(f"Error fetching options for {expiration}: {e}")
                continue

        print(f"Retrieved {len(all_options_data)} options contracts")
        return all_options_data

    except Exception as e:
        print(f"Error fetching options data: {e}")
        return []


def generate_heatmap_from_options(options_data, current_price):
    """
    Generate heat map data from real options data
    Aggregates by strike price across expirations
    """
    print("Generating heat map from real options data...")

    if not options_data:
        print("No options data available")
        return []

    # Group by strike and expiration
    heatmap_data = []

    for option in options_data:
        strike = option['strike']
        expiration = option['expiration']

        # Find matching call and put for same strike/expiration
        call_data = next((o for o in options_data
                         if o['strike'] == strike
                         and o['expiration'] == expiration
                         and o['type'] == 'call'), None)

        put_data = next((o for o in options_data
                        if o['strike'] == strike
                        and o['expiration'] == expiration
                        and o['type'] == 'put'), None)

        call_volume = call_data['volume'] if call_data else 0
        put_volume = put_data['volume'] if put_data else 0
        call_oi = call_data['open_interest'] if call_data else 0
        put_oi = put_data['open_interest'] if put_data else 0

        # Only add if we have at least one side with data
        if call_volume > 0 or put_volume > 0 or call_oi > 0 or put_oi > 0:
            heatmap_data.append({
                "date": expiration,
                "strike": round(strike, 2),
                "call_volume": call_volume,
                "put_volume": put_volume,
                "call_open_interest": call_oi,
                "put_open_interest": put_oi,
                "net_volume": call_volume - put_volume,
                "net_open_interest": call_oi - put_oi,
                "total_volume": call_volume + put_volume,
                "total_open_interest": call_oi + put_oi,
                "distance_from_price": round(((strike - current_price) / current_price) * 100, 2)
            })

    # Remove duplicates and sort by date and strike
    seen = set()
    unique_data = []
    for item in heatmap_data:
        key = (item['date'], item['strike'])
        if key not in seen:
            seen.add(key)
            unique_data.append(item)

    unique_data.sort(key=lambda x: (x['date'], x['strike']))

    print(f"Generated {len(unique_data)} heat map data points")
    return unique_data


def calculate_price_levels(heatmap_data):
    """
    Aggregate data by strike price to show volume and open interest concentration
    """
    print("Calculating price level concentrations...")

    if not heatmap_data:
        return []

    # Group by strike
    strike_data = {}
    for item in heatmap_data:
        strike = item['strike']
        if strike not in strike_data:
            strike_data[strike] = {
                'strike': strike,
                'total_call_volume': 0,
                'total_put_volume': 0,
                'total_call_oi': 0,
                'total_put_oi': 0,
                'total_volume': 0,
                'total_open_interest': 0,
                'net_volume': 0,
                'net_open_interest': 0
            }

        strike_data[strike]['total_call_volume'] += item['call_volume']
        strike_data[strike]['total_put_volume'] += item['put_volume']
        strike_data[strike]['total_call_oi'] += item['call_open_interest']
        strike_data[strike]['total_put_oi'] += item['put_open_interest']
        strike_data[strike]['total_volume'] += item['total_volume']
        strike_data[strike]['total_open_interest'] += item['total_open_interest']
        strike_data[strike]['net_volume'] += item['net_volume']
        strike_data[strike]['net_open_interest'] += item['net_open_interest']

    # Convert to list and sort by strike
    price_levels = sorted(strike_data.values(), key=lambda x: x['strike'])

    return price_levels


def load_history(history_file):
    """Load existing historical snapshots"""
    if os.path.exists(history_file):
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading history file: {e}")
            return {"snapshots": []}
    return {"snapshots": []}


def save_snapshot_to_history(current_data, history_file):
    """
    Save current snapshot to historical record
    Keeps weekly snapshots for the last year (52 weeks)
    """
    print("Saving snapshot to history...")

    history = load_history(history_file)

    # Create snapshot with essential data
    snapshot = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "timestamp": datetime.now().isoformat(),
        "futures_price": current_data["metadata"]["futures_price"],
        "etf_price": current_data["metadata"]["etf_price"],
        "options_summary": {
            "total_call_volume": sum(o["volume"] for o in current_data["options_data"] if o["type"] == "call"),
            "total_put_volume": sum(o["volume"] for o in current_data["options_data"] if o["type"] == "put"),
            "total_call_oi": sum(o["open_interest"] for o in current_data["options_data"] if o["type"] == "call"),
            "total_put_oi": sum(o["open_interest"] for o in current_data["options_data"] if o["type"] == "put"),
        },
        "top_strikes": {
            "calls": sorted(
                current_data["price_levels"],
                key=lambda x: x["total_call_oi"],
                reverse=True
            )[:5],
            "puts": sorted(
                current_data["price_levels"],
                key=lambda x: x["total_put_oi"],
                reverse=True
            )[:5]
        },
        "cot_latest": current_data["cot_data"][-1] if current_data["cot_data"] else None
    }

    # Add to history
    history["snapshots"].append(snapshot)

    # Keep only last 52 weeks
    if len(history["snapshots"]) > 52:
        history["snapshots"] = history["snapshots"][-52:]

    # Save updated history
    try:
        with open(history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
        print(f"History saved: {len(history['snapshots'])} snapshots total")
    except Exception as e:
        print(f"Error saving history: {e}")


def fetch_instrument_data(config):
    """
    Main function to fetch data for any instrument

    config should contain:
    - instrument_name: Display name (e.g., "Gold")
    - futures_symbol: Yahoo Finance futures symbol (e.g., "GC=F")
    - etf_symbol: Yahoo Finance ETF symbol (e.g., "GLD")
    - cftc_code: CFTC contract code (optional)
    - output_file: Path to output JSON file
    - history_file: Path to history JSON file
    - price_unit: Description of price unit
    - scale_factor: Multiplier to scale ETF strikes to futures price (optional, default 1)
    """
    instrument_name = config['instrument_name']

    try:
        # Fetch futures prices
        futures_price, price_history = fetch_futures_prices(config['futures_symbol'], instrument_name)

        if futures_price is None or price_history is None:
            print(f"Failed to fetch {instrument_name} price data")
            return False

        # Get ETF current price (for options context)
        print(f"Fetching {config['etf_symbol']} current price...")
        etf_ticker = yf.Ticker(config['etf_symbol'])
        etf_hist = etf_ticker.history(period="1d")
        etf_current_price = etf_hist['Close'].iloc[-1] if not etf_hist.empty else None

        if etf_current_price is None:
            print(f"Warning: Could not fetch {config['etf_symbol']} current price")
            etf_current_price = futures_price / config.get('scale_factor', 1)

        print(f"{instrument_name} Futures ({config['futures_symbol']}): ${futures_price:.2f}")
        print(f"{config['etf_symbol']} ETF Price: ${etf_current_price:.2f}")

        # Fetch real options data
        options_data = fetch_real_options_data(config['etf_symbol'], instrument_name)

        if not options_data:
            print("Warning: No real options data available")
            heatmap_data = []
            price_levels = []
            source_note = "Options data unavailable from Yahoo Finance"
        else:
            # Generate heat map from real options data
            heatmap_data = generate_heatmap_from_options(options_data, etf_current_price)
            price_levels = calculate_price_levels(heatmap_data)
            source_note = f"Real {config['etf_symbol']} options data from Yahoo Finance ({len(options_data)} contracts)"

        # Fetch COT data
        cot_data = fetch_cot_data(config.get('cftc_code'), instrument_name)

        if not cot_data:
            print("Warning: Failed to fetch COT data")
            cot_note = "COT data unavailable"
        else:
            cot_note = f"COT positioning from CFTC ({len(cot_data)} weeks)"

        # Build result structure
        result = {
            "metadata": {
                "instrument": instrument_name,
                "source": f"Yahoo Finance ({config['futures_symbol']} futures & {config['etf_symbol']} options), CFTC COT Report (positioning)",
                "indicator": f"{instrument_name} Futures & Options Positioning",
                "description": f"Real {instrument_name} futures prices and {config['etf_symbol']} ETF options chain data.",
                "fetched_at": datetime.now().isoformat(),
                "futures_price": round(futures_price, 2),
                "etf_price": round(etf_current_price, 2),
                "current_price": round(futures_price, 2),
                "price_unit": config.get('price_unit', 'USD'),
                "scale_factor": config.get('scale_factor', 1),
                "note": f"{source_note}. {cot_note}"
            },
            "price_history": price_history,
            "cot_data": cot_data,
            "options_data": options_data,
            "heatmap_data": heatmap_data,
            "price_levels": price_levels
        }

        # Save current data to JSON
        with open(config['output_file'], "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"\nData saved to: {config['output_file']}")

        # Save snapshot to history
        save_snapshot_to_history(result, config['history_file'])

        print(f"{instrument_name} Futures Price: ${futures_price:.2f}")
        print(f"{config['etf_symbol']} ETF Price: ${etf_current_price:.2f}")
        print(f"Price history entries: {len(price_history)}")
        print(f"Options contracts: {len(options_data)}")
        print(f"Heat map data points: {len(heatmap_data)}")
        print(f"Price levels: {len(price_levels)}")
        print(f"COT data entries: {len(cot_data)}")

        # Show recent COT positioning
        if cot_data:
            latest = cot_data[-1]
            print(f"\nLatest COT positioning ({latest['date']}):")
            print(f"  Commercial: Long {latest['commercial_long']:,} | Short {latest['commercial_short']:,}")
            print(f"  Large Specs: Long {latest['non_commercial_long']:,} | Short {latest['non_commercial_short']:,}")
            print(f"  Small Traders: Long {latest['non_reportable_long']:,} | Short {latest['non_reportable_short']:,}")

        # Show options summary
        if options_data:
            total_call_volume = sum(o['volume'] for o in options_data if o['type'] == 'call')
            total_put_volume = sum(o['volume'] for o in options_data if o['type'] == 'put')
            total_call_oi = sum(o['open_interest'] for o in options_data if o['type'] == 'call')
            total_put_oi = sum(o['open_interest'] for o in options_data if o['type'] == 'put')

            print(f"\nOptions Summary:")
            print(f"  Total Call Volume: {total_call_volume:,}")
            print(f"  Total Put Volume: {total_put_volume:,}")
            print(f"  Total Call Open Interest: {total_call_oi:,}")
            print(f"  Total Put Open Interest: {total_put_oi:,}")
            if total_call_volume > 0:
                print(f"  Put/Call Volume Ratio: {total_put_volume/total_call_volume:.2f}")

        return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False
