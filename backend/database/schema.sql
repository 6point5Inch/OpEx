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

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  orderHash TEXT PRIMARY KEY,
  signature TEXT NOT NULL,
  data_json TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  remainingMakerAmount TEXT NOT NULL,
  makerBalance TEXT NOT NULL,
  makerAllowance TEXT NOT NULL,
  makerRate TEXT NOT NULL,
  takerRate TEXT NOT NULL,
  isMakerContract INTEGER NOT NULL,
  orderInvalidReason_json TEXT,
  status INTEGER NOT NULL,
  makerAsset TEXT NOT NULL,
  takerAsset TEXT NOT NULL,
  maker TEXT NOT NULL,
  receiver TEXT NOT NULL,
  makingAmount TEXT NOT NULL,
  takingAmount TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assets ON orders(makerAsset, takerAsset);
CREATE INDEX IF NOT EXISTS idx_orders_maker ON orders(maker);
CREATE INDEX IF NOT EXISTS idx_orders_create ON orders(createdAt);