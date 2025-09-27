import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from scipy.integrate import quad
from numba import jit
from datetime import datetime, timedelta

# -------------------------
# Database connection
# -------------------------
DB_NAME = "crypto_info"
DB_USER = "postgres"
DB_PASSWORD = "mypassword"
DB_HOST = "localhost"
DB_PORT = "5433"

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# -------------------------
# Heston model functions
# -------------------------
@jit(nopython=True)
def heston_cf(phi, S, T, r, kappa, theta, sigma, rho, v0, j):
    i = 1j
    u = 0.5 if j == 1 else -0.5
    b = kappa - rho * sigma if j == 1 else kappa
    d = np.sqrt((rho * sigma * i * phi - b)**2 - sigma**2 * (2 * u * i * phi - phi**2))
    g = (b - rho * sigma * i * phi + d) / (b - rho * sigma * i * phi - d)
    C = r * i * phi * T + (kappa * theta / sigma**2) * ((b - rho * sigma * i * phi + d)*T - 2 * np.log((1 - g * np.exp(d * T)) / (1 - g)))
    D = ((b - rho * sigma * i * phi + d) / sigma**2) * ((1 - np.exp(d * T)) / (1 - g * np.exp(d * T)))
    return np.exp(C + D * v0 + i * phi * np.log(S))

@jit(nopython=True)
def integrand(phi, S, K, T, r, kappa, theta, sigma, rho, v0, j):
    i = 1j
    return (np.exp(-i * phi * np.log(K)) * heston_cf(phi, S, T, r, kappa, theta, sigma, rho, v0, j) / (i * phi)).real if phi != 0 else 0.0

def heston_price(S, K, T, r, kappa, theta, sigma, rho, v0, option_type):
    phi_max = 85
    quad_options = {'limit': 300, 'epsabs': 1e-6, 'epsrel': 1e-6}
    P1 = 0.5 + (1/np.pi) * quad(integrand, 0, phi_max, args=(S, K, T, r, kappa, theta, sigma, rho, v0, 1), **quad_options)[0]
    P2 = 0.5 + (1/np.pi) * quad(integrand, 0, phi_max, args=(S, K, T, r, kappa, theta, sigma, rho, v0, 2), **quad_options)[0]
    if option_type == "call":
        return max(S * P1 - K * np.exp(-r * T) * P2, 0)
    elif option_type == "put":
        return max(K * np.exp(-r * T) * (1 - P2) - S * (1 - P1), 0)
    else:
        return None

# -------------------------
# Strike generation
# -------------------------
def get_tick_size(spot):
    if spot < 1: return 0.001
    elif spot < 100: return 0.1
    elif spot < 1000: return 1
    else: return 10

def generate_strikes(spot, pct_range=0.1, num_steps=5):
    tick_size = get_tick_size(spot)
    strikes = []
    for step in range(-num_steps, num_steps + 1):
        pct = step * (pct_range / num_steps)
        strike = round(spot * (1 + pct) / tick_size) * tick_size
        strikes.append(strike)
    return sorted(list(set(strikes)))

def build_instruments(spot, symbol, expiry_buckets=[7,30], option_types=["call","put"]):
    strikes = generate_strikes(spot)
    instruments = []
    for strike in strikes:
        for expiry in expiry_buckets:
            for opt_type in option_types:
                instruments.append({
                    "symbol": symbol,
                    "strike": strike,
                    "expiry_days": expiry,
                    "type": opt_type
                })
    return instruments

# -------------------------
# Main generic method
# -------------------------
def run_heston_for_symbol(symbol, spreads=0.02, r=0.01, kappa=0.5, theta=0.04, sigma=0.8, rho=-0.7):
    """
    Fetch latest spot for `symbol`, compute Heston option prices, store in DB.
    Returns DataFrame of market data.
    """
    query = """
        SELECT p.close AS spot_price, cr.crypto_id
        FROM crypto_prices p
        JOIN cryptocurrencies cr ON p.crypto_id = cr.crypto_id
        WHERE cr.symbol = :symbol
        ORDER BY p.timestamp DESC
        LIMIT 50
    """
    df_spot = pd.read_sql(text(query), engine, params={"symbol": symbol})
    if df_spot.empty:
        raise ValueError(f"No spot prices found for {symbol}")

    latest_spot = df_spot["spot_price"].iloc[0]
    print("LATEST: ",latest_spot)
    crypto_id = int(df_spot["crypto_id"].iloc[0])
    log_returns = np.log(df_spot["spot_price"] / df_spot["spot_price"].shift(1)).dropna()
    v0 = np.var(log_returns)

    instruments = build_instruments(latest_spot, symbol)
    market_data = []
    for inst in instruments:
        T = inst["expiry_days"] / 365
        mtm_price = heston_price(latest_spot, inst["strike"], T, r, kappa, theta, sigma, rho, v0, inst["type"])
        market_data.append({
            "instrument": f"{symbol}-{inst['strike']}-{inst['expiry_days']}d-{inst['type']}",
            "bid": mtm_price*(1-spreads/2),
            "ask": mtm_price*(1+spreads/2),
            "crypto_id": crypto_id,
            "strike_price": inst['strike'],
            "expiry_days": inst['expiry_days'],
            "option_type": inst['type']
        })

    df_market = pd.DataFrame(market_data)
    with engine.begin() as conn:
        for _, row in df_market.iterrows():
            expiration_timestamp = int((datetime.now() + timedelta(days=row['expiry_days'])).timestamp())
            conn.execute(text("""
                INSERT INTO crypto_options (
                    instrument_name, timestamp, crypto_id, heston_price, strike_price, expiration_date, option_type
                ) VALUES (:instrument_name, NOW(), :crypto_id, :price, :strike_price, :expiration_date, :option_type)
                ON CONFLICT (instrument_name, timestamp) DO UPDATE
                SET heston_price = EXCLUDED.heston_price
            """), {
                "instrument_name": row["instrument"],
                "crypto_id": row["crypto_id"],
                "price": (row["bid"] + row["ask"]) / 2,
                "strike_price": row["strike_price"],
                "expiration_date": expiration_timestamp,
                "option_type": row["option_type"]
            })

    return df_market


run_heston_for_symbol("ETH")
run_heston_for_symbol("1INCH")