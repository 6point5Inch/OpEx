import asyncio
import httpx
from sqlalchemy import create_engine, text
from datetime import datetime, timezone
import time
import requests

DB_NAME = "crypto_info"
DB_USER = "postgres"
DB_PASSWORD = "mypassword"
DB_HOST = "localhost"
DB_PORT = "5433"

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

FEED_MAP = {
    "1INCH": "63f341689d98a12ef60a5cff1d7f85c70a9e17bf1575f0e7c0b2512d48b1c8b3",
    "ETH": "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
}

BASE_URL_HIST = "https://benchmarks.pyth.network/v1/updates/price"
BASE_URL_LIVE = "https://hermes.pyth.network/v2/updates/price/latest"
THROTTLE = 2.5

def fetch_historical_backfill(symbols):
    """Fetch historical data per symbol separately"""
    now = int(time.time())
    timestamps = [now - i * 2.5 for i in range(360 * 5)]  # last ~5 hours, every 10s

    for symbol in symbols:
        feed_id = FEED_MAP[symbol]
        print(f"⏳ Backfilling historical data for {symbol}...")

        for ts in reversed(timestamps):
            url = f"{BASE_URL_HIST}/{ts}?ids={feed_id}&encoding=hex&parsed=true"
            try:
                response = requests.get(url, timeout=5)
                response.raise_for_status()
                data = response.json()
                parsed = data.get("parsed", [])
                if not parsed:
                    continue

                feed = parsed[0]
                price_info = feed.get("price")
                if not price_info:
                    continue

                price_val = int(price_info["price"]) * (10 ** int(price_info["expo"]))
                print(price_info)
                ts_dt = datetime.fromtimestamp(int(price_info["publish_time"]), tz=timezone.utc)

                with engine.begin() as conn:
                    crypto_id = conn.execute(
                        text("SELECT crypto_id FROM cryptocurrencies WHERE symbol=:symbol"),
                        {"symbol": symbol}
                    ).scalar()
                    conn.execute(text("""
                        INSERT INTO crypto_prices (crypto_id, timestamp, open, high, low, close, volume, symbol)
                        VALUES (:crypto_id, :ts, :open, :high, :low, :close, :volume, :symbol)
                        ON CONFLICT (crypto_id, timestamp) DO UPDATE
                        SET close=EXCLUDED.close, open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low, volume=EXCLUDED.volume
                    """), {
                        "crypto_id": crypto_id,
                        "ts": ts_dt,
                        "open": price_val,
                        "high": price_val,
                        "low": price_val,
                        "close": price_val,
                        "volume": 0,
                        "symbol": symbol
                    })
                # Optional small delay to avoid rate limits
                time.sleep(0.05)
            except Exception as e:
                print(f"❌ Failed to backfill {symbol} at ts={ts}: {e}")
        print(f"✅ Completed historical backfill for {symbol}")
    print("✅ All historical backfills completed")

async def fetch_and_store_price(symbol: str, client: httpx.AsyncClient):
    """Fetch live price for a single symbol asynchronously"""
    feed_id = FEED_MAP[symbol]
    try:
        url = f"{BASE_URL_LIVE}?ids[]={feed_id}"
        resp = await client.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        feed = data.get("parsed", [])[0]
        price_info = feed.get("price")
        if price_info:
            price_val = int(price_info["price"]) * (10 ** (price_info["expo"]))
            ts_dt = datetime.fromtimestamp(int(price_info["publish_time"]), tz=timezone.utc)
            with engine.begin() as conn:
                crypto_id = conn.execute(
                    text("SELECT crypto_id FROM cryptocurrencies WHERE symbol=:symbol"),
                    {"symbol": symbol}
                ).scalar()
                conn.execute(text("""
                    INSERT INTO crypto_prices (crypto_id, timestamp, open, high, low, close, volume, symbol)
                    VALUES (:crypto_id, :ts, :open, :high, :low, :close, :volume, :symbol)
                    ON CONFLICT (crypto_id, timestamp) DO UPDATE
                    SET close=EXCLUDED.close, open=EXCLUDED.open, high=EXCLUDED.high, low=EXCLUDED.low, volume=EXCLUDED.volume
                """), {
                    "crypto_id": crypto_id,
                    "ts": ts_dt,
                    "open": price_val,
                    "high": price_val,
                    "low": price_val,
                    "close": price_val,
                    "volume": 0,
                    "symbol": symbol
                })
            print(f"✅ Updated {symbol} price: {price_val}")
    except Exception as e:
        print(e)
        print(f"❌ Failed to update {symbol}: {e}")

async def live_polling(symbols):
    """Continuously fetch all symbols concurrently"""
    async with httpx.AsyncClient() as client:
        while True:
            tasks = [fetch_and_store_price(symbol, client) for symbol in symbols]
            await asyncio.gather(*tasks)
            await asyncio.sleep(THROTTLE)

if __name__ == "__main__":
    symbols_to_track = list(FEED_MAP.keys())
    print("⏳ Starting historical backfill...")
    # fetch_historical_backfill(symbols_to_track)
    print("🚀 Starting live async polling...")
    asyncio.run(live_polling(symbols_to_track))
