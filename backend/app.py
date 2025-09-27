import json
import subprocess
import atexit
import time
import threading
from typing import Any, Dict, Optional, List, Tuple

from decimal import Decimal
from datetime import datetime, timezone

from flask import Flask, jsonify, request, abort, make_response
from flask_socketio import SocketIO, emit

from apscheduler.schedulers.background import BackgroundScheduler

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, RowMapping
from sqlalchemy.exc import IntegrityError

# -------------------------
# Flask + SocketIO setup
# -------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------
# Database (Postgres via SQLAlchemy)
# -------------------------
DB_NAME = "crypto_info"
DB_USER = "postgres"
DB_PASSWORD = "mypassword"
DB_HOST = "localhost"
DB_PORT = "5432"

ALLOWED_SORT = {"createdAt", "takerRate", "makerRate", "makerAmount", "takerAmount"}

engine = create_engine(f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}", future=True)

# -------------------------
# Background processes
# -------------------------
fetch_price_process = None


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def abort_bad_request(message: str):
    payload = {"statusCode": 400, "message": message, "error": "Bad Request"}
    abort(make_response(jsonify(payload), 400))


# ------------------------------ Validation ------------------------------
def validate_address(addr: str, field: str) -> None:
    """
    Basic validation: expects a 0x-prefixed hex string of length 42 (20 bytes) or ENS-like names.
    Raises a 400 abort if invalid.
    """
    if not isinstance(addr, str) or not addr:
        abort_bad_request(f"bad {field}")
    # allow ENS-like (contain a dot) or 0x-address
    if addr.startswith("0x"):
        # hex check (42 chars, 0x + 40 hex chars)
        if len(addr) != 42:
            abort_bad_request(f"bad {field}: invalid length")
        try:
            int(addr[2:], 16)
        except ValueError:
            abort_bad_request(f"bad {field}: not hex")
    else:
        # simple ENS-ish check (keep it permissive)
        if " " in addr or len(addr) < 3:
            abort_bad_request(f"bad {field}")


def parse_statuses(s: Optional[str]) -> Optional[List[int]]:
    if not s:
        return None
    try:
        vals = [int(x.strip()) for x in s.split(",") if x.strip()]
        for v in vals:
            if v not in (1, 2, 3):
                raise ValueError
        return vals
    except Exception:
        abort_bad_request("bad statuses")


def parse_pagination() -> Tuple[int, int]:
    try:
        page = int(request.args.get("page", "1"))
        limit = int(request.args.get("limit", "100"))
        if page < 1 or limit < 1 or limit > 500:
            raise ValueError
        return page, limit
    except Exception:
        abort_bad_request("bad pagination")


def parse_sort_by() -> Optional[str]:
    sort_by = request.args.get("sortBy")
    if sort_by is None:
        return None
    if sort_by not in ALLOWED_SORT:
        abort_bad_request("bad sortBy")
    return sort_by


# ------------------------------ DB helpers ------------------------------
def get_db() -> Connection:
    """
    Returns a SQLAlchemy Connection. Caller is responsible for closing the connection,
    but using "with get_db() as conn:" is preferred.
    """
    return engine.connect()


def build_where(filters: Dict[str, Any], params: Dict[str, Any]) -> str:
    """
    Build WHERE clause using named parameters and fill params dict.
    Supported filters keys: statuses (List[int]), takerAsset, makerAsset, address
    """
    clauses: List[str] = []
    if "statuses" in filters and filters["statuses"]:
        sts = filters["statuses"]
        names = []
        for i, v in enumerate(sts):
            key = f"status_{len(params)}_{i}"
            names.append(f":{key}")
            params[key] = v
        clauses.append(f"status IN ({', '.join(names)})")
    if "takerAsset" in filters and filters["takerAsset"]:
        params_key = f"takerAsset_{len(params)}"
        clauses.append(f"takerAsset = :{params_key}")
        params[params_key] = filters["takerAsset"]
    if "makerAsset" in filters and filters["makerAsset"]:
        params_key = f"makerAsset_{len(params)}"
        clauses.append(f"makerAsset = :{params_key}")
        params[params_key] = filters["makerAsset"]
    if "address" in filters and filters["address"]:
        params_key = f"address_{len(params)}"
        clauses.append(f"(maker = :{params_key} OR receiver = :{params_key})")
        params[params_key] = filters["address"]
    return (" WHERE " + " AND ".join(clauses)) if clauses else ""


def select_orders(conn: Connection, filters: Dict[str, Any], page: int, limit: int, sort_by: Optional[str]) -> List[Dict[str, Any]]:
    offset = (page - 1) * limit
    params: Dict[str, Any] = {}
    where = build_where(filters, params)

    order_col = {
        "createdAt": "createdAt",
        "takerRate": "takerRate",
        "makerRate": "makerRate",
        "makerAmount": "makingAmount",
        "takerAmount": "takingAmount",
        None: "createdAt"
    }[sort_by]

    sql = text(f"""
        SELECT * FROM orders
        {where}
        ORDER BY {order_col} DESC
        LIMIT :_limit OFFSET :_offset
    """)
    params["_limit"] = limit
    params["_offset"] = offset

    rows = conn.execute(sql, params).mappings().all()
    return [serialize_order(r) for r in rows]


def count_orders(conn: Connection, filters: Dict[str, Any]) -> int:
    params: Dict[str, Any] = {}
    where = build_where(filters, params)
    sql = text(f"SELECT COUNT(*) AS c FROM orders {where}")
    row = conn.execute(sql, params).mappings().first()
    return int(row["c"]) if row and "c" in row else 0


def serialize_order(row: RowMapping) -> Dict[str, Any]:
    """
    row is a SQLAlchemy RowMapping (like a dict). Convert fields and parse json fields.
    """
    data = {}
    try:
        data = json.loads(row["data_json"]) if row.get("data_json") else {}
    except Exception:
        data = {}
    invalid_reason = None
    try:
        invalid_reason = json.loads(row["orderInvalidReason_json"]) if row.get("orderInvalidReason_json") else None
    except Exception:
        invalid_reason = None

    def conv(v):
        if isinstance(v, Decimal):
            return float(v)
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    return {
        "signature": row.get("signature"),
        "orderHash": row.get("orderHash"),
        "createdAt": conv(row.get("createdAt")),
        "remainingMakerAmount": conv(row.get("remainingMakerAmount")),
        "makerBalance": conv(row.get("makerBalance")),
        "makerAllowance": conv(row.get("makerAllowance")),
        "data": data,
        "makerRate": conv(row.get("makerRate")),
        "takerRate": conv(row.get("takerRate")),
        "isMakerContract": bool(row.get("isMakerContract")),
        "orderInvalidReason": invalid_reason,
        "makerAsset": row.get("makerAsset"),
        "takerAsset": row.get("takerAsset"),
        "maker": row.get("maker"),
        "receiver": row.get("receiver"),
        "makingAmount": conv(row.get("makingAmount")),
        "takingAmount": conv(row.get("takingAmount")),
        "status": row.get("status"),
    }


# ------------------------------
# Background jobs
# ------------------------------
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
    query = text("""
        SELECT DISTINCT ON (instrument_name) 
            instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
        FROM crypto_options
        ORDER BY instrument_name, timestamp DESC
    """)
    with get_db() as conn:
        rows = conn.execute(query).mappings().all()
    return jsonify([{k: convert_value(v) for k, v in row.items()} for row in rows])


@app.route("/option/history")
def get_option_history():
    instrument_name = request.args.get("instrument")
    if not instrument_name:
        return jsonify({"error": "Missing instrument parameter"}), 400

    query = text("""
        SELECT instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
        FROM crypto_options
        WHERE instrument_name = :instrument
        ORDER BY timestamp ASC
    """)
    with get_db() as conn:
        rows = conn.execute(query, {"instrument": instrument_name}).mappings().all()
    if not rows:
        return jsonify({"error": "No data found for instrument"}), 404
    return jsonify([{k: convert_value(v) for k, v in row.items()} for row in rows])


@app.post("/<chainId>/")
def create_limit_order(chainId: str):
    body = request.get_json(silent=True) or {}
    required = ["orderHash", "signature", "data"]
    for f in required:
        if f not in body:
            return jsonify({"statusCode": 400, "message": f"Missing {f}", "error": "Bad Request"}), 400

    data = body["data"]
    for f in ["makerAsset", "takerAsset", "maker", "makingAmount", "takingAmount", "salt"]:
        if f not in data:
            return jsonify({"statusCode": 400, "message": f"Missing data.{f}", "error": "Bad Request"}), 400

    # validate addresses
    for addr_field in ("makerAsset", "takerAsset", "maker"):
        validate_address(data[addr_field], addr_field)
    receiver = data.get("receiver", "0x0000000000000000000000000000000000000000")
    if receiver:
        validate_address(receiver, "receiver")

    order = {
        "orderHash": body["orderHash"],
        "signature": body["signature"],
        "data_json": json.dumps(data),
        "createdAt": now_iso(),
        "remainingMakerAmount": data["makingAmount"],
        "makerBalance": "0",
        "makerAllowance": "0",
        "makerRate": data.get("makerRate", "0"),
        "takerRate": data.get("takerRate", "0"),
        "isMakerContract": 0,
        "orderInvalidReason_json": json.dumps(None),
        "status": 1,
        "makerAsset": data["makerAsset"],
        "takerAsset": data["takerAsset"],
        "maker": data["maker"],
        "receiver": receiver,
        "makingAmount": data["makingAmount"],
        "takingAmount": data["takingAmount"],
    }

    insert_sql = text("""
        INSERT INTO orders (
            orderHash, signature, data_json, createdAt,
            remainingMakerAmount, makerBalance, makerAllowance,
            makerRate, takerRate, isMakerContract, orderInvalidReason_json,
            status, makerAsset, takerAsset, maker, receiver, makingAmount, takingAmount
        ) VALUES (
            :orderHash, :signature, :data_json, :createdAt,
            :remainingMakerAmount, :makerBalance, :makerAllowance,
            :makerRate, :takerRate, :isMakerContract, :orderInvalidReason_json,
            :status, :makerAsset, :takerAsset, :maker, :receiver, :makingAmount, :takingAmount
        )
    """)

    try:
        with get_db() as conn:
            conn.execute(insert_sql, order)
            conn.commit()
    except IntegrityError:
        return jsonify({"statusCode": 400, "message": "Duplicate orderHash", "error": "Bad Request"}), 400
    except Exception as e:
        # general DB error
        return jsonify({"statusCode": 500, "message": "DB error", "error": str(e)}), 500

    return jsonify({"success": True}), 201


@app.get("/<chainId>/address/<address>")
def get_orders_by_address(chainId: str, address: str):
    validate_address(address, "address")
    page, limit = parse_pagination()
    statuses = parse_statuses(request.args.get("statuses"))
    sort_by = parse_sort_by()
    takerAsset = request.args.get("takerAsset")
    makerAsset = request.args.get("makerAsset")
    if takerAsset:
        validate_address(takerAsset, "takerAsset")
    if makerAsset:
        validate_address(makerAsset, "makerAsset")

    with get_db() as conn:
        items = select_orders(conn, {"statuses": statuses, "takerAsset": takerAsset, "makerAsset": makerAsset, "address": address}, page, limit, sort_by)
    return jsonify(items)


# @app.get("/<chainId>/order/<orderHash>")
# def get_order_by_hash(chainId: str, orderHash: str):
#     with get_db() as conn:
#         row = conn.execute(text("SELECT * FROM orders WHERE orderHash = :h"), {"h": orderHash}).mappings().first()
#     if not row:
#         return jsonify([]), 200
#     return jsonify(serialize_order(row)), 200


@app.get("/<chainId>/all")
def get_all_orders(chainId: str):
    page, limit = parse_pagination()
    statuses = parse_statuses(request.args.get("statuses"))
    sort_by = parse_sort_by()
    takerAsset = request.args.get("takerAsset")
    makerAsset = request.args.get("makerAsset")
    if takerAsset:
        validate_address(takerAsset, "takerAsset")
    if makerAsset:
        validate_address(makerAsset, "makerAsset")

    with get_db() as conn:
        items = select_orders(conn, {"statuses": statuses, "takerAsset": takerAsset, "makerAsset": makerAsset}, page, limit, sort_by)
    return jsonify(items)


# @app.get("/<chainId>/count")
# def get_count(chainId: str):
#     statuses = parse_statuses(request.args.get("statuses"))
#     takerAsset = request.args.get("takerAsset")
#     makerAsset = request.args.get("makerAsset")
#     if takerAsset:
#         validate_address(takerAsset, "takerAsset")
#     if makerAsset:
#         validate_address(makerAsset, "makerAsset")

#     with get_db() as conn:
#         c = count_orders(conn, {"statuses": statuses, "takerAsset": takerAsset, "makerAsset": makerAsset})
#     return jsonify({"count": c})


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
    with get_db() as conn:
        rows = conn.execute(text("""
            SELECT instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
            FROM crypto_options
            WHERE instrument_name = :instrument
            ORDER BY timestamp ASC
        """), {"instrument": instrument}).mappings().all()

    emit('history', {
        "instrument": instrument,
        "data": [{k: convert_value(v) for k, v in r.items()} for r in rows]
    })

    # Background thread to stream updates
    def stream_updates(sid, instrument_name, last_ts):
        while True:
            try:
                with get_db() as conn:
                    row = conn.execute(text("""
                        SELECT instrument_name, heston_price, strike_price, expiration_date, option_type, timestamp
                        FROM crypto_options
                        WHERE instrument_name = :instrument
                        ORDER BY timestamp DESC
                        LIMIT 1
                    """), {"instrument": instrument_name}).mappings().first()

                if row and (last_ts is None or row["timestamp"] > last_ts):
                    emit('update', {
                        "instrument": instrument_name,
                        "data": {k: convert_value(v) for k, v in dict(row).items()}
                    }, to=sid)
                    last_ts = row["timestamp"]
            except Exception as e:
                print("subscribe stream error:", e)
            time.sleep(1)

    last_ts = rows[-1]["timestamp"] if rows else None
    t = threading.Thread(target=stream_updates, args=(request.sid, instrument, last_ts), daemon=True)
    t.start()


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
