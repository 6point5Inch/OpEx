// API Response Types
export interface ApiOptionResponse {
  expiration_date: number;
  heston_price: number;
  instrument_name: string;
  option_type: "call" | "put";
  strike_price: number;
  timestamp: string;
}

export interface ApiHistoryResponse {
  expiration_date: number;
  heston_price: number;
  instrument_name: string;
  option_type: "call" | "put";
  strike_price: number;
  timestamp: string;
}

// Processed data types for the UI
export interface ProcessedOptionData {
  strikePrice: number;
  expirationDate: number;
  calls: {
    delta: number;
    size: number;
    ivBid: number;
    bid: number;
    mark: number;
    ask: number;
    ivAsk: number;
    size2: number;
    position: number;
    volume?: number;
    openInterest?: number;
    instrument_name: string;
    timestamp: string;
  };
  puts: {
    delta: number;
    size: number;
    ivBid: number;
    bid: number;
    mark: number;
    ask: number;
    ivAsk: number;
    size2: number;
    position: number;
    volume?: number;
    openInterest?: number;
    instrument_name: string;
    timestamp: string;
  };
}

// Chart data type for candlestick chart
export interface ChartDataPoint {
  timestamp: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}
