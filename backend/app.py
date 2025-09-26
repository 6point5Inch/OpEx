from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import create_engine, text
from decimal import Decimal
from datetime import datetime
import subprocess
import atexit
import time
import threading

# -------------------------
# Flask + SocketIO setup
# -------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------
# Database
# -------------------------
DB_NAME = "crypto_info"
DB_USER = "postgres"
DB_PASSWORD = "mypassword"
DB_HOST = "localhost"
DB_PORT = "5432"
engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# -------------------------
# Background processes
# -------------------------
fetch_price_process = None

def start_fetch_price():
    global fetch_price_process
    if fetch_price_process is None or fetch_price_process.poll() is not None:
        fetch_price_process = subprocess.Popen(["python", "scripts/fetch_price.py"])
        print("✅ fetch_price started")
    else:
        print("ℹ️ fetch_price already running")

def run_heston_model():
    try:
        subprocess.run(["python", "scripts/heston_model.py"], check=True)
        print("✅ heston_model job executed")
    except Exception as e:
        print(f"❌ heston_model failed: {e}")

scheduler = BackgroundScheduler()
scheduler.add_job(func=run_heston_model, trigger="interval", seconds=1, id="heston_model_job")
atexit.register(lambda: scheduler.shutdown())

# -------------------------
# Helper: Convert Decimal and datetime
# -------------------------
def convert_value(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj

# -------------------------
# REST Endpoints
# -------------------------
@app.route("/options/latest")
def get_latest_options():
    query = """
        SELECT DISTINCT ON (instrument_name) 
            instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
        FROM crypto_options
        ORDER BY instrument_name, timestamp DESC
    """
    with engine.connect() as conn:
        rows = conn.execute(text(query)).mappings().all()
    return jsonify([{k: convert_value(v) for k,v in row.items()} for row in rows])

@app.route("/option/history")
def get_option_history():
    instrument_name = request.args.get("instrument")
    if not instrument_name:
        return jsonify({"error": "Missing instrument parameter"}), 400

    query = """
        SELECT instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
        FROM crypto_options
        WHERE instrument_name = :instrument
        ORDER BY timestamp ASC
    """
    with engine.connect() as conn:
        rows = conn.execute(text(query), {"instrument": instrument_name}).mappings().all()
    if not rows:
        return jsonify({"error": "No data found for instrument"}), 404
    return jsonify([{k: convert_value(v) for k,v in row.items()} for row in rows])

# -------------------------
# SocketIO events
# -------------------------
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")
    emit('message', f"Connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

@socketio.on('subscribe')
def handle_subscribe(data):
    instrument = data.get("instrument")
    if not instrument:
        emit('error', {"error": "Missing instrument"})
        return

    # Send historical data
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
            FROM crypto_options
            WHERE instrument_name = :instrument
            ORDER BY timestamp ASC
        """), {"instrument": instrument}).mappings().all()

    emit('history', {
        "instrument": instrument,
        "data": [{k: convert_value(v) for k,v in r.items()} for r in rows]
    })

    # Background thread to stream updates
    def stream_updates():
        last_ts = rows[-1]["timestamp"] if rows else None
        while True:
            with engine.connect() as conn:
                row = conn.execute(text("""
                    SELECT instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
                    FROM crypto_options
                    WHERE instrument_name = :instrument
                    ORDER BY timestamp DESC
                    LIMIT 1
                """), {"instrument": instrument}).mappings().first()

            if row and (last_ts is None or row["timestamp"] > last_ts):
                emit('update', {
                    "instrument": instrument,
                    "data": {k: convert_value(v) for k,v in dict(row).items()}
                }, to=request.sid)
                last_ts = row["timestamp"]

            time.sleep(1)

    threading.Thread(target=stream_updates, daemon=True).start()

# -------------------------
# Main entry
# -------------------------
if __name__ == "__main__":
    start_fetch_price()
    print("⏳ Waiting 10 seconds for fetch_price to initialize...")
    time.sleep(10)

    scheduler.start()
    print("✅ Heston Scheduler started")

    print("🚀 Starting Flask-SocketIO server...")
    socketio.run(app, host="0.0.0.0", port=5000)
