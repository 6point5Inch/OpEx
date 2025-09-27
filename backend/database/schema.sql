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


-- Table: holdings
CREATE TABLE public.holdings (
    id SERIAL PRIMARY KEY,
    user_address TEXT NOT NULL,
    instrument_name TEXT NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL,
    expiry_date BIGINT NOT NULL,
    strike_price NUMERIC(18, 8) NOT NULL,
    option_type VARCHAR(4) NOT NULL,
    current_price NUMERIC(18, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT holdings_instrument_unique UNIQUE (user_address, instrument_name)
);

-- Indexes for holdings table
CREATE INDEX idx_holdings_user_address ON public.holdings (user_address);
CREATE INDEX idx_holdings_instrument_name ON public.holdings (instrument_name);
CREATE INDEX idx_holdings_expiry_date ON public.holdings (expiry_date);


-- Orders table (PostgreSQL syntax)
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    order_hash TEXT UNIQUE NOT NULL,
    maker TEXT NOT NULL,
    maker_asset TEXT NOT NULL,
    taker_asset TEXT NOT NULL,
    making_amount TEXT NOT NULL,
    taking_amount TEXT NOT NULL,
    salt TEXT NOT NULL,
    maker_traits TEXT NOT NULL,
    order_data TEXT NOT NULL,
    option_strike NUMERIC(18,8),
    option_expiry BIGINT,
    option_type VARCHAR(4),
    option_premium NUMERIC(18,8),
    signature TEXT,
    extension_data TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_maker ON public.orders(maker);
CREATE INDEX IF NOT EXISTS idx_orders_assets ON public.orders(maker_asset, taker_asset);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_hash ON public.orders(order_hash);