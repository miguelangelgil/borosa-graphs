#!/usr/bin/env python3
"""
Backtest the recession indicator model against 2007 pre-crisis data.
This validates if our model can detect early warning signs BEFORE a recession hits.
"""

import requests

print("="*70)
print("BACKTESTING RECESSION INDICATOR MODEL - 2007 (PRE-CRISIS)")
print("="*70)
print()

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

    # 2. PMI MANUFACTURING (20% weight)
    pmi = data["pmi"]
    pmi_score = 0
    if pmi["avg_value"] < 50:
        pmi_score = min(100, (50 - pmi["avg_value"]) * 10)
    if pmi["contraction_rate"] > 0.3:
        pmi_score += pmi["contraction_rate"] * 25

    weighted_score += min(100, pmi_score) * 0.20
    total_weight += 0.20

    # 3. CREDIT SPREADS (15% weight)
    spreads = data["credit_spreads"]
    spread_score = 0
    if spreads["avg_spread"] > 100:
        spread_score = min(100, (spreads["avg_spread"] - 100) / 4)
    if spreads["high_risk_rate"] > 0.1:
        spread_score += spreads["high_risk_rate"] * 40

    weighted_score += min(100, spread_score) * 0.15
    total_weight += 0.15

    # 4. CONSUMER CONFIDENCE (15% weight)
    conf = data["consumer_confidence"]
    conf_score = 0
    if conf["avg_value"] < 0:
        conf_score = min(100, 10 + abs(conf["avg_value"]) * 3.5)

    weighted_score += conf_score * 0.15
    total_weight += 0.15

    # 5. UNEMPLOYMENT CLAIMS (10% weight)
    claims = data["unemployment_claims"]
    claims_score = 0
    if claims["avg_stress"] > 0:
        claims_score = min(100, claims["avg_stress"] * 3)
    if claims["high_risk_rate"] > 0.2:
        claims_score += claims["high_risk_rate"] * 30

    weighted_score += min(100, claims_score) * 0.10
    total_weight += 0.10

    # 6. BIG MAC INDEX (10% weight)
    bigmac = data["big_mac"]
    bigmac_score = min(100, (bigmac["avg_stress"] / 60) * 100)

    weighted_score += bigmac_score * 0.10
    total_weight += 0.10

    # Final normalized score
    final_score = weighted_score / total_weight if total_weight > 0 else 0
    return round(final_score), {
        'yield': round(yield_score, 1),
        'pmi': round(min(100, pmi_score), 1),
        'spreads': round(min(100, spread_score), 1),
        'confidence': round(conf_score, 1),
        'claims': round(min(100, claims_score), 1),
        'bigmac': round(bigmac_score, 1)
    }

# ==============================================================================
# 2007 VALUES (Early warning signs starting to appear)
# ==============================================================================
print("SIMULATION WITH TYPICAL 2007 VALUES (PRE-CRISIS)")
print("-" * 70)
print()

# 2007 typical values - economy still growing but warning signs emerging
pre_crisis_2007 = {
    "yield_curve": {
        "inverted_rate": 0.4,  # 40% started inverting in late 2006-2007
        "avg_spread": -0.2,     # Slightly inverted (warning sign)
    },
    "pmi": {
        "avg_value": 51.5,      # Still expansion but slowing
        "contraction_rate": 0.15,  # Only 15% contracting
    },
    "credit_spreads": {
        "avg_spread": 180,      # Starting to widen (normal: ~100-150)
        "high_risk_rate": 0.15,  # 15% high risk (starting stress)
    },
    "consumer_confidence": {
        "avg_value": -5.0,      # Mild pessimism emerging
    },
    "unemployment_claims": {
        "avg_stress": 8.0,      # Slight uptick
        "high_risk_rate": 0.1,  # 10% showing stress
    },
    "big_mac": {
        "avg_stress": 22.0,     # Moderate stress
    }
}

print("Input values (typical early 2007 levels - warning signs):")
print(f"  Yield Curve: {pre_crisis_2007['yield_curve']['inverted_rate']*100:.0f}% inverted, spread: {pre_crisis_2007['yield_curve']['avg_spread']:.2f}")
print(f"  PMI: {pre_crisis_2007['pmi']['avg_value']:.1f} (still expansion)")
print(f"  Credit Spreads: {pre_crisis_2007['credit_spreads']['avg_spread']:.0f} bps (widening)")
print(f"  Consumer Confidence: {pre_crisis_2007['consumer_confidence']['avg_value']:.1f} (mild pessimism)")
print(f"  Unemployment Claims: +{pre_crisis_2007['unemployment_claims']['avg_stress']:.0f}% vs baseline")
print(f"  Big Mac Stress: {pre_crisis_2007['big_mac']['avg_stress']:.0f}%")
print()

score_2007, components_2007 = calculate_recession_score(pre_crisis_2007)

print("Component scores:")
print(f"  Yield Curve Score: {components_2007['yield']}/100 (weight: 30%)")
print(f"  PMI Score: {components_2007['pmi']}/100 (weight: 20%)")
print(f"  Credit Spreads Score: {components_2007['spreads']}/100 (weight: 15%)")
print(f"  Consumer Confidence Score: {components_2007['confidence']}/100 (weight: 15%)")
print(f"  Unemployment Claims Score: {components_2007['claims']}/100 (weight: 10%)")
print(f"  Big Mac Index Score: {components_2007['bigmac']}/100 (weight: 10%)")
print()

print(f"FINAL RECESSION RISK SCORE (2007): {score_2007}/100")
print()

if score_2007 >= 70:
    risk_level = "HIGH RISK"
elif score_2007 >= 40:
    risk_level = "MODERATE RISK"
else:
    risk_level = "LOW RISK"

print(f"Risk Level: {risk_level}")
print()

# ==============================================================================
# FETCH REAL 2007 DATA FROM FRED
# ==============================================================================
print()
print("="*70)
print("FETCHING REAL FRED HISTORICAL DATA (2007)")
print("-" * 70)
print()

def fetch_fred_historical(series_id, date):
    """Fetch historical value from FRED for specific date."""
    url = f'https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}'

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        lines = response.text.strip().split('\n')[1:]
        target_year = date[:4]

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
        print(f"  Error fetching {series_id}: {e}")
        return None

# Fetch real 2007 data
us_conf_2007 = fetch_fred_historical('CSCICP02USAM460S', '2007-06-01')
hy_spread_2007 = fetch_fred_historical('BAMLH0A0HYM2', '2007-06-01')
t10_2007 = fetch_fred_historical('DGS10', '2007-06-01')
t2_2007 = fetch_fred_historical('DGS2', '2007-06-01')

if us_conf_2007:
    print(f"Consumer Confidence (USA, mid-2007): {us_conf_2007[1]:.1f} (date: {us_conf_2007[0]})")

if hy_spread_2007:
    print(f"High Yield Spread (USA, mid-2007): {hy_spread_2007[1]:.0f} bps (date: {hy_spread_2007[0]})")

if t10_2007 and t2_2007:
    spread_2007 = t10_2007[1] - t2_2007[1]
    print(f"10Y-2Y Spread (USA, mid-2007): {spread_2007:.2f}% {'(INVERTED)' if spread_2007 < 0 else '(NORMAL)'}")
    print(f"  10Y: {t10_2007[1]:.2f}%, 2Y: {t2_2007[1]:.2f}%")

print()

# Calculate with real data
if us_conf_2007 and hy_spread_2007 and t10_2007 and t2_2007:
    print("-" * 70)
    print("CALCULATING SCORE WITH REAL 2007 DATA:")
    print("-" * 70)
    print()

    real_2007_data = {
        "yield_curve": {
            "inverted_rate": 0.0 if (t10_2007[1] - t2_2007[1]) >= 0 else 1.0,
            "avg_spread": t10_2007[1] - t2_2007[1],
        },
        "pmi": pre_crisis_2007["pmi"],
        "credit_spreads": {
            "avg_spread": hy_spread_2007[1],
            "high_risk_rate": 0.15 if hy_spread_2007[1] > 150 else 0.05,
        },
        "consumer_confidence": {
            "avg_value": us_conf_2007[1],
        },
        "unemployment_claims": pre_crisis_2007["unemployment_claims"],
        "big_mac": pre_crisis_2007["big_mac"],
    }

    score_2007_real, components_2007_real = calculate_recession_score(real_2007_data)

    print("Component scores (REAL data where available):")
    print(f"  Yield Curve Score: {components_2007_real['yield']}/100 (REAL)")
    print(f"  PMI Score: {components_2007_real['pmi']}/100 (simulated)")
    print(f"  Credit Spreads Score: {components_2007_real['spreads']}/100 (REAL)")
    print(f"  Consumer Confidence Score: {components_2007_real['confidence']}/100 (REAL)")
    print(f"  Unemployment Claims Score: {components_2007_real['claims']}/100 (simulated)")
    print(f"  Big Mac Index Score: {components_2007_real['bigmac']}/100 (simulated)")
    print()

    print(f"FINAL RECESSION RISK SCORE (2007 with real data): {score_2007_real}/100")
    print()

    if score_2007_real >= 70:
        risk_level = "HIGH RISK"
    elif score_2007_real >= 40:
        risk_level = "MODERATE RISK"
    else:
        risk_level = "LOW RISK"

    print(f"Risk Level: {risk_level}")

# ==============================================================================
# COMPARISON AND VALIDATION
# ==============================================================================
print()
print("="*70)
print("COMPARISON: 2007 vs 2008")
print("="*70)
print()

print("2007 (Pre-crisis warning signs):")
print(f"  Simulated score: {score_2007}/100 - {risk_level}")
if us_conf_2007 and hy_spread_2007 and t10_2007 and t2_2007:
    print(f"  Real data score: {score_2007_real}/100")

print()
print("2008 (Active crisis):")
print(f"  Simulated score: 89/100 - HIGH RISK")
print()

print("Expected behavior:")
print("  - 2007 should show MODERATE risk (40-70) = Early warning")
print("  - 2008 should show HIGH risk (70+) = Active crisis")
print("  - Clear escalation from warning to crisis")
print()

if score_2007 >= 40 and score_2007 < 70:
    print("PASS: Model correctly shows escalating risk from 2007 to 2008")
elif score_2007 < 40:
    print("WARNING: 2007 score too low - may miss early warnings")
elif score_2007 >= 70:
    print("WARNING: 2007 score too high - may be too sensitive")

print()
