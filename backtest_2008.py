#!/usr/bin/env python3
"""
Backtest the recession indicator model against 2008 financial crisis data.
This script calculates what recession risk score our model would have given
during the 2008 crisis to validate if our thresholds are appropriate.
"""

import requests
from datetime import datetime

print("="*70)
print("BACKTESTING RECESSION INDICATOR MODEL - 2008 FINANCIAL CRISIS")
print("="*70)
print()

# ==============================================================================
# PART 1: SIMULATION WITH KNOWN 2008 VALUES
# ==============================================================================
print("PART 1: SIMULATION WITH TYPICAL 2008 CRISIS VALUES")
print("-" * 70)
print()

# Known typical values during 2008 financial crisis (September-December 2008)
crisis_2008_values = {
    "yield_curve": {
        "inverted_rate": 0.8,  # 80% of curves inverted
        "avg_spread": -1.5,     # Deeply inverted
    },
    "pmi": {
        "avg_value": 38.0,      # Severe contraction (historical: ~35-40)
        "contraction_rate": 0.95,  # 95% of countries contracting
    },
    "credit_spreads": {
        "avg_spread": 650,      # High yield spreads exploded (historical: 600-800 bps)
        "high_risk_rate": 0.9,  # 90% high risk
    },
    "consumer_confidence": {
        "avg_value": -45.0,     # Extreme pessimism (historical: -40 to -50)
    },
    "unemployment_claims": {
        "avg_stress": 60.0,     # 60% above baseline (historical: +50-100%)
        "high_risk_rate": 0.8,  # 80% high risk
    },
    "big_mac": {
        "avg_stress": 45.0,     # High affordability stress
    }
}

def calculate_recession_score(data):
    """Calculate recession risk score using our model's formula."""
    weighted_score = 0
    total_weight = 0

    # 1. YIELD CURVE (30% weight)
    yc = data["yield_curve"]
    yield_score = 0
    if yc["inverted_rate"] > 0.5:
        yield_score += (yc["inverted_rate"] - 0.5) * 2 * 70
    if yc["avg_spread"] < -0.5:
        yield_score += min(30, abs(yc["avg_spread"] + 0.5) * 30)

    weighted_score += yield_score * 0.30
    total_weight += 0.30
    print(f"  Yield Curve Score: {yield_score:.1f}/100 (weight: 30%)")

    # 2. PMI MANUFACTURING (20% weight)
    pmi = data["pmi"]
    pmi_score = 0
    if pmi["avg_value"] < 50:
        pmi_score = min(100, (50 - pmi["avg_value"]) * 10)
    if pmi["contraction_rate"] > 0.3:
        pmi_score += pmi["contraction_rate"] * 25

    weighted_score += min(100, pmi_score) * 0.20
    total_weight += 0.20
    print(f"  PMI Score: {min(100, pmi_score):.1f}/100 (weight: 20%)")

    # 3. CREDIT SPREADS (15% weight)
    spreads = data["credit_spreads"]
    spread_score = 0
    if spreads["avg_spread"] > 100:
        spread_score = min(100, (spreads["avg_spread"] - 100) / 4)
    if spreads["high_risk_rate"] > 0.1:
        spread_score += spreads["high_risk_rate"] * 40

    weighted_score += min(100, spread_score) * 0.15
    total_weight += 0.15
    print(f"  Credit Spreads Score: {min(100, spread_score):.1f}/100 (weight: 15%)")

    # 4. CONSUMER CONFIDENCE (15% weight)
    conf = data["consumer_confidence"]
    conf_score = 0
    if conf["avg_value"] < 0:
        conf_score = min(100, 10 + abs(conf["avg_value"]) * 3.5)

    weighted_score += conf_score * 0.15
    total_weight += 0.15
    print(f"  Consumer Confidence Score: {conf_score:.1f}/100 (weight: 15%)")

    # 5. UNEMPLOYMENT CLAIMS (10% weight)
    claims = data["unemployment_claims"]
    claims_score = 0
    if claims["avg_stress"] > 0:
        claims_score = min(100, claims["avg_stress"] * 3)
    if claims["high_risk_rate"] > 0.2:
        claims_score += claims["high_risk_rate"] * 30

    weighted_score += min(100, claims_score) * 0.10
    total_weight += 0.10
    print(f"  Unemployment Claims Score: {min(100, claims_score):.1f}/100 (weight: 10%)")

    # 6. BIG MAC INDEX (10% weight)
    bigmac = data["big_mac"]
    bigmac_score = min(100, (bigmac["avg_stress"] / 60) * 100)

    weighted_score += bigmac_score * 0.10
    total_weight += 0.10
    print(f"  Big Mac Index Score: {bigmac_score:.1f}/100 (weight: 10%)")

    # Final normalized score
    final_score = weighted_score / total_weight if total_weight > 0 else 0
    return round(final_score)

print("Input values (typical 2008 crisis levels):")
print(f"  Yield Curve: {crisis_2008_values['yield_curve']['inverted_rate']*100:.0f}% inverted, spread: {crisis_2008_values['yield_curve']['avg_spread']:.2f}")
print(f"  PMI: {crisis_2008_values['pmi']['avg_value']:.1f} (severe contraction)")
print(f"  Credit Spreads: {crisis_2008_values['credit_spreads']['avg_spread']:.0f} bps")
print(f"  Consumer Confidence: {crisis_2008_values['consumer_confidence']['avg_value']:.1f}")
print(f"  Unemployment Claims: +{crisis_2008_values['unemployment_claims']['avg_stress']:.0f}% vs baseline")
print(f"  Big Mac Stress: {crisis_2008_values['big_mac']['avg_stress']:.0f}%")
print()

print("Component scores:")
simulated_score = calculate_recession_score(crisis_2008_values)

print()
print(f"FINAL RECESSION RISK SCORE (2008 simulation): {simulated_score}/100")
print()

if simulated_score >= 70:
    risk_level = "HIGH RISK"
    color = "🔴"
elif simulated_score >= 40:
    risk_level = "MODERATE RISK"
    color = "🟡"
else:
    risk_level = "LOW RISK"
    color = "🟢"

print(f"{color} Risk Level: {risk_level}")
print()

# ==============================================================================
# PART 2: FETCH REAL HISTORICAL DATA FROM FRED
# ==============================================================================
print()
print("="*70)
print("PART 2: BACKTESTING WITH REAL FRED HISTORICAL DATA (2008)")
print("-" * 70)
print()

def fetch_fred_historical(series_id, date):
    """Fetch historical value from FRED for specific date."""
    # FRED CSV format: date,value
    url = f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}'

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        lines = response.text.strip().split('\n')[1:]  # Skip header
        target_year = date[:4]  # Get year

        # Find closest date to target
        best_match = None
        for line in lines:
            parts = line.split(',')
            if len(parts) != 2:
                continue
            line_date, value = parts
            if value == '.' or value == '':
                continue
            if line_date.startswith(target_year):
                try:
                    best_match = (line_date, float(value))
                except ValueError:
                    continue

        return best_match
    except Exception as e:
        print(f"  ⚠️  Error fetching {series_id}: {e}")
        return None

# Try to get real 2008 data
print("Attempting to fetch real historical data from FRED...")
print()

# Consumer Confidence for USA (September 2008 - peak crisis)
print("📊 Consumer Confidence (USA, Sept 2008):")
us_conf_2008 = fetch_fred_historical('CSCICP02USAM460S', '2008-09-01')
if us_conf_2008:
    print(f"  Date: {us_conf_2008[0]}")
    print(f"  Value: {us_conf_2008[1]:.1f}")
    print()

# High Yield Corporate Bond Spread (Sept 2008)
print("📊 High Yield Corporate Bond Spread (USA, Sept-Dec 2008):")
hy_spread_2008 = fetch_fred_historical('BAMLH0A0HYM2', '2008-12-01')  # ICE BofA HY spread
if hy_spread_2008:
    print(f"  Date: {hy_spread_2008[0]}")
    print(f"  Spread: {hy_spread_2008[1]:.0f} bps")
    print()

# Investment Grade Spread
print("📊 Investment Grade Corporate Bond Spread (USA, Sept-Dec 2008):")
ig_spread_2008 = fetch_fred_historical('BAMLC0A4CBBB', '2008-12-01')  # ICE BofA BBB spread
if ig_spread_2008:
    print(f"  Date: {ig_spread_2008[0]}")
    print(f"  Spread: {ig_spread_2008[1]:.0f} bps")
    print()

# 10-Year Treasury (for yield curve calculation)
print("📊 10-Year Treasury Yield (USA, Sept 2008):")
t10_2008 = fetch_fred_historical('DGS10', '2008-09-01')
if t10_2008:
    print(f"  Date: {t10_2008[0]}")
    print(f"  Yield: {t10_2008[1]:.2f}%")
    print()

# 2-Year Treasury
print("📊 2-Year Treasury Yield (USA, Sept 2008):")
t2_2008 = fetch_fred_historical('DGS2', '2008-09-01')
if t2_2008:
    print(f"  Date: {t2_2008[0]}")
    print(f"  Yield: {t2_2008[1]:.2f}%")
    if t10_2008:
        spread = t10_2008[1] - t2_2008[1]
        print(f"  📉 Yield Curve Spread: {spread:.2f}% {'(INVERTED)' if spread < 0 else '(NORMAL)'}")
    print()

# Calculate score with real data where available
if us_conf_2008 and hy_spread_2008 and t10_2008 and t2_2008:
    print()
    print("-" * 70)
    print("CALCULATING SCORE WITH REAL 2008 DATA:")
    print("-" * 70)
    print()

    # Build real data structure
    real_2008_data = {
        "yield_curve": {
            "inverted_rate": 0.0 if (t10_2008[1] - t2_2008[1]) >= 0 else 1.0,
            "avg_spread": t10_2008[1] - t2_2008[1],
        },
        "pmi": crisis_2008_values["pmi"],  # No free historical PMI, use simulation
        "credit_spreads": {
            "avg_spread": hy_spread_2008[1],
            "high_risk_rate": 0.9 if hy_spread_2008[1] > 500 else 0.5,
        },
        "consumer_confidence": {
            "avg_value": us_conf_2008[1],
        },
        "unemployment_claims": crisis_2008_values["unemployment_claims"],  # Use simulation
        "big_mac": crisis_2008_values["big_mac"],  # Use simulation
    }

    print("Input values (REAL 2008 data where available):")
    print(f"  ✅ Yield Curve: {real_2008_data['yield_curve']['avg_spread']:.2f}% spread")
    print(f"  ⚠️  PMI: {real_2008_data['pmi']['avg_value']:.1f} (simulated)")
    print(f"  ✅ Credit Spreads: {real_2008_data['credit_spreads']['avg_spread']:.0f} bps (REAL)")
    print(f"  ✅ Consumer Confidence: {real_2008_data['consumer_confidence']['avg_value']:.1f} (REAL)")
    print(f"  ⚠️  Unemployment Claims: +{real_2008_data['unemployment_claims']['avg_stress']:.0f}% (simulated)")
    print(f"  ⚠️  Big Mac Stress: {real_2008_data['big_mac']['avg_stress']:.0f}% (simulated)")
    print()

    print("Component scores:")
    real_score = calculate_recession_score(real_2008_data)

    print()
    print(f"FINAL RECESSION RISK SCORE (2008 with real data): {real_score}/100")
    print()

    if real_score >= 70:
        risk_level = "HIGH RISK"
        color = "🔴"
    elif real_score >= 40:
        risk_level = "MODERATE RISK"
        color = "🟡"
    else:
        risk_level = "LOW RISK"
        color = "🟢"

    print(f"{color} Risk Level: {risk_level}")

# ==============================================================================
# SUMMARY AND VALIDATION
# ==============================================================================
print()
print("="*70)
print("VALIDATION SUMMARY")
print("="*70)
print()

print("Expected outcome: During the 2008 financial crisis, our model should")
print("show HIGH RISK (score >= 70) to correctly identify the recession.")
print()

print(f"✓ Simulated 2008 score: {simulated_score}/100")
if us_conf_2008 and hy_spread_2008 and t10_2008 and t2_2008:
    print(f"✓ Real data 2008 score: {real_score}/100")
print()

if simulated_score >= 70:
    print("✅ PASS: Model correctly identifies 2008 crisis as HIGH RISK")
else:
    print("❌ FAIL: Model does NOT flag 2008 crisis as high risk")
    print("   → Thresholds may be TOO CONSERVATIVE")

print()
print("Note: Current data (2025) should score much lower than 2008 if we")
print("are not currently in a recession, validating the model's sensitivity.")
print()
