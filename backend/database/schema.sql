-- Table: cryptocurrencies
CREATE TABLE public.cryptocurrencies (
    crypto_id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Pre-populate cryptocurrencies
INSERT INTO public.cryptocurrencies (crypto_id, symbol, name) VALUES
(1, '1INCH', '1inch'),
(2, 'BTC', 'Bitcoin'),
(3, 'ETH', 'Ethereum');

-- Table: crypto_prices
CREATE TABLE public.crypto_prices (
    price_id SERIAL PRIMARY KEY,
    crypto_id INTEGER NOT NULL REFERENCES public.cryptocurrencies(crypto_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    open NUMERIC(18,8) NOT NULL,
    high NUMERIC(18,8) NOT NULL,
    low NUMERIC(18,8) NOT NULL,
    close NUMERIC(18,8) NOT NULL,
    volume NUMERIC(22,8) NOT NULL,
    symbol TEXT,
    CONSTRAINT crypto_prices_crypto_id_timestamp_key UNIQUE (crypto_id, timestamp)
);

-- Indexes for crypto_prices
CREATE INDEX idx_crypto_prices_crypto_id ON public.crypto_prices (crypto_id);
CREATE INDEX idx_crypto_prices_timestamp ON public.crypto_prices (timestamp);

-- Table: crypto_options
CREATE TABLE public.crypto_options (
    instrument_name TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    crypto_id INTEGER NOT NULL REFERENCES public.cryptocurrencies(crypto_id) ON DELETE CASCADE,
    heston_price NUMERIC(18, 8),
    expiration_date BIGINT,
    strike_price NUMERIC(18, 8),
    option_type VARCHAR(4),
    PRIMARY KEY (instrument_name, timestamp)
);

-- ==========================
-- Table: limit_orders
-- ==========================
CREATE TABLE public.limit_orders (
    order_id SERIAL PRIMARY KEY,
    order_hash TEXT UNIQUE NOT NULL,           -- orderHash
    signature TEXT NOT NULL,                   -- EIP-712 signature
    maker_asset VARCHAR(66) NOT NULL,          -- ERC20 address
    taker_asset VARCHAR(66) NOT NULL,          -- ERC20 address
    maker_address VARCHAR(66) NOT NULL,        -- Maker wallet
    receiver_address VARCHAR(66) DEFAULT '0x0000000000000000000000000000000000000000',
    making_amount NUMERIC(78,0) NOT NULL,      -- BigNumber token amounts
    taking_amount NUMERIC(78,0) NOT NULL,
    salt TEXT NOT NULL,
    extension TEXT DEFAULT '0x',
    maker_traits TEXT DEFAULT '0',

    -- Runtime data
    create_datetime TIMESTAMPTZ DEFAULT now() NOT NULL,
    remaining_maker_amount NUMERIC(78,0) NOT NULL,
    maker_balance NUMERIC(78,0) DEFAULT 0,
    maker_allowance NUMERIC(78,0) DEFAULT 0,

    maker_rate NUMERIC(38,18),
    taker_rate NUMERIC(38,18),
    is_maker_contract BOOLEAN DEFAULT FALSE,
    order_invalid_reason TEXT[],

    status SMALLINT DEFAULT 1 NOT NULL,        -- 1=Valid, 2=Temp Invalid, 3=Invalid
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for fast querying
CREATE INDEX idx_limit_orders_order_hash ON public.limit_orders (order_hash);
CREATE INDEX idx_limit_orders_maker_asset ON public.limit_orders (maker_asset);
CREATE INDEX idx_limit_orders_taker_asset ON public.limit_orders (taker_asset);
CREATE INDEX idx_limit_orders_maker ON public.limit_orders (maker_address);
CREATE INDEX idx_limit_orders_status ON public.limit_orders (status);

-- ==========================
-- Table: limit_order_events
-- ==========================
CREATE TABLE public.limit_order_events (
    event_id SERIAL PRIMARY KEY,
    order_hash TEXT NOT NULL REFERENCES public.limit_orders(order_hash) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('fill','cancel')),
    taker_address VARCHAR(66),
    remaining_maker_amount NUMERIC(78,0),
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT,
    log_id TEXT,
    network INT DEFAULT 1,
    version SMALLINT DEFAULT 4,
    create_datetime TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_limit_order_events_order_hash ON public.limit_order_events (order_hash);
CREATE INDEX idx_limit_order_events_txhash ON public.limit_order_events (transaction_hash);

-- ==========================
-- Table: active_unique_pairs (materialized view candidate)
-- ==========================
-- You can build this as a query, but if you want to persist:
CREATE TABLE public.active_unique_pairs (
    pair_id SERIAL PRIMARY KEY,
    maker_asset VARCHAR(66) NOT NULL,
    taker_asset VARCHAR(66) NOT NULL,
    UNIQUE (maker_asset, taker_asset)
);

-- ==========================
-- Helper: orders_count (view)
-- ==========================
-- Can be computed dynamically instead of stored
CREATE OR REPLACE VIEW public.orders_count AS
SELECT status, COUNT(*) as count
FROM public.limit_orders
GROUP BY status;
