import {
  ApiOptionResponse,
  ApiHistoryResponse,
  ProcessedOptionData,
  ChartDataPoint,
} from "@/types/api";

const API_BASE_URL = "http://localhost:5080";

// Fetch all options data
export async function fetchOptionsData(): Promise<ApiOptionResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/options/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching options data:", error);
    throw error;
  }
}

// Fetch option history for a specific instrument
export async function fetchOptionHistory(
  instrument: string
): Promise<ApiHistoryResponse[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/option/history?instrument=${encodeURIComponent(
        instrument
      )}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching option history:", error);
    throw error;
  }
}

// Process raw API data into the format expected by the UI
export function processOptionsData(
  apiData: ApiOptionResponse[]
): ProcessedOptionData[] {
  // Group by strike price and expiration date
  const groupedData = new Map<
    string,
    { calls?: ApiOptionResponse; puts?: ApiOptionResponse }
  >();

  apiData.forEach((option) => {
    const key = `${option.strike_price}-${option.expiration_date}`;

    if (!groupedData.has(key)) {
      groupedData.set(key, {});
    }

    const group = groupedData.get(key)!;
    if (option.option_type === "call") {
      group.calls = option;
    } else {
      group.puts = option;
    }
  });

  // Convert to ProcessedOptionData format
  const processedData: ProcessedOptionData[] = [];

  groupedData.forEach((group, key) => {
    const [strikePrice, expirationDate] = key.split("-");

    // Create default option data structure
    const createDefaultOptionData = (option?: ApiOptionResponse) => ({
      delta: -69, // Placeholder for unavailable data
      size: -69,
      ivBid: -69,
      bid: option?.heston_price || -69,
      mark: option?.heston_price || -69,
      ask: option?.heston_price ? option.heston_price * 1.02 : -69, // Add small spread for ask
      ivAsk: -69,
      size2: -69,
      position: -69,
      volume: -69,
      openInterest: -69,
      instrument_name: option?.instrument_name || "",
      timestamp: option?.timestamp || "",
    });

    processedData.push({
      strikePrice: parseFloat(strikePrice),
      expirationDate: parseInt(expirationDate),
      calls: createDefaultOptionData(group.calls),
      puts: createDefaultOptionData(group.puts),
    });
  });

  // Sort by strike price
  return processedData.sort((a, b) => a.strikePrice - b.strikePrice);
}

// Process history data for candlestick chart
export function processHistoryDataForChart(
  historyData: ApiHistoryResponse[]
): ChartDataPoint[] {
  if (historyData.length === 0) return [];

  // Group by time intervals (e.g., every 5 minutes)
  const timeInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
  const groupedData = new Map<number, number[]>();

  historyData.forEach((item) => {
    // Skip invalid prices
    if (item.heston_price <= 0) return;

    const timestamp = new Date(item.timestamp).getTime();
    const intervalStart = Math.floor(timestamp / timeInterval) * timeInterval;

    if (!groupedData.has(intervalStart)) {
      groupedData.set(intervalStart, []);
    }

    groupedData.get(intervalStart)!.push(item.heston_price);
  });

  // Convert to OHLC format
  const chartData: ChartDataPoint[] = [];

  groupedData.forEach((prices, timestamp) => {
    if (prices.length > 0) {
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);

      // Ensure OHLC values are valid
      if (open > 0 && close > 0 && high > 0 && low > 0) {
        chartData.push({
          timestamp: new Date(timestamp).toISOString(),
          date: new Date(timestamp),
          open,
          high,
          low,
          close,
        });
      }
    }
  });

  return chartData.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Convert ProcessedOptionData to the legacy OptionsData format for compatibility
export function convertToLegacyFormat(processedData: ProcessedOptionData[]) {
  return processedData.map((item) => ({
    strikePrice: item.strikePrice,
    calls: {
      delta: item.calls.delta,
      size: item.calls.size,
      ivBid:
        item.calls.ivBid === -69 ? item.calls.ivBid : item.calls.ivBid / 100, // Convert to decimal format if not placeholder
      bid: item.calls.bid,
      mark: item.calls.mark,
      ask: item.calls.ask,
      ivAsk:
        item.calls.ivAsk === -69 ? item.calls.ivAsk : item.calls.ivAsk / 100, // Convert to decimal format if not placeholder
      size2: item.calls.size2,
      position: item.calls.position,
      volume: item.calls.volume === -69 ? undefined : item.calls.volume,
      openInterest:
        item.calls.openInterest === -69 ? undefined : item.calls.openInterest,
      instrumentName: item.calls.instrument_name,
    },
    puts: {
      delta: item.puts.delta,
      size: item.puts.size,
      ivBid: item.puts.ivBid === -69 ? item.puts.ivBid : item.puts.ivBid / 100, // Convert to decimal format if not placeholder
      bid: item.puts.bid,
      mark: item.puts.mark,
      ask: item.puts.ask,
      ivAsk: item.puts.ivAsk === -69 ? item.puts.ivAsk : item.puts.ivAsk / 100, // Convert to decimal format if not placeholder
      size2: item.puts.size2,
      position: item.puts.position,
      volume: item.puts.volume === -69 ? undefined : item.puts.volume,
      openInterest:
        item.puts.openInterest === -69 ? undefined : item.puts.openInterest,
      instrumentName: item.puts.instrument_name,
    },
  }));
}

// Helper function to get the current underlying price
export function getCurrentUnderlyingPrice(
  optionsData: ProcessedOptionData[]
): number {
  // This is a simplified calculation - in reality you'd get this from a separate endpoint
  // For now, we'll estimate it based on the middle strike prices
  if (optionsData.length === 0) return 0.214; // Default fallback

  const sortedStrikes = optionsData
    .map((d) => d.strikePrice)
    .sort((a, b) => a - b);
  const middleIndex = Math.floor(sortedStrikes.length / 2);
  return sortedStrikes[middleIndex];
}

// Helper function to format expiration date
export function formatExpirationDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper function to calculate time to expiry
export function calculateTimeToExpiry(expirationTimestamp: number): string {
  const now = Date.now();
  const expiry = expirationTimestamp * 1000;
  const timeDiff = expiry - now;

  if (timeDiff <= 0) return "Expired";

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else {
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

// Parse instrument name to extract components
export function parseInstrumentName(instrumentName: string) {
  // Format: <underlying_asset>-<strike_price>-<expiry_date>-<call/put>
  // Example: 1INCH-0.219-7d-put
  const parts = instrumentName.split("-");
  if (parts.length !== 4) {
    console.warn(`Invalid instrument name format: ${instrumentName}`);
    return null;
  }

  return {
    underlyingAsset: parts[0],
    strikePrice: parseFloat(parts[1]),
    expiryPeriod: parts[2], // e.g., "7d", "30d"
    optionType: parts[3] as "call" | "put",
  };
}

// Filter options data by underlying asset
export function filterByUnderlyingAsset(
  apiData: ApiOptionResponse[],
  underlyingAsset: string
): ApiOptionResponse[] {
  return apiData.filter((option) => {
    const parsed = parseInstrumentName(option.instrument_name);
    return parsed?.underlyingAsset === underlyingAsset;
  });
}

// Filter options data by expiry period
export function filterByExpiryPeriod(
  apiData: ApiOptionResponse[],
  expiryPeriod: string
): ApiOptionResponse[] {
  return apiData.filter((option) => {
    const parsed = parseInstrumentName(option.instrument_name);
    return parsed?.expiryPeriod === expiryPeriod;
  });
}

// Get unique underlying assets from API data
export function getUniqueUnderlyingAssets(
  apiData: ApiOptionResponse[]
): string[] {
  const assets = new Set<string>();

  apiData.forEach((option) => {
    const parsed = parseInstrumentName(option.instrument_name);
    if (parsed) {
      assets.add(parsed.underlyingAsset);
    }
  });

  return Array.from(assets).sort();
}

// Get unique expiry periods from API data
export function getUniqueExpiryPeriods(apiData: ApiOptionResponse[]): string[] {
  const periods = new Set<string>();

  apiData.forEach((option) => {
    const parsed = parseInstrumentName(option.instrument_name);
    if (parsed) {
      periods.add(parsed.expiryPeriod);
    }
  });

  return Array.from(periods).sort();
}

// Price-related API functions
export interface LivePriceData {
  price: number;
  timestamp: string;
  symbol: string;
}

export interface LivePricesResponse {
  success: boolean;
  data: Record<string, LivePriceData>;
  timestamp: string;
}

export interface DetailedPriceData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

export interface DetailedPriceResponse {
  success: boolean;
  data: DetailedPriceData;
  timestamp: string;
}

export interface PriceHistoryResponse {
  success: boolean;
  data: DetailedPriceData[];
  symbol: string;
  count: number;
  timestamp: string;
}

// Fetch live prices for all supported underlying assets
export async function fetchLivePrices(): Promise<LivePricesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/prices/live`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching live prices:", error);
    throw error;
  }
}

// Fetch live price for a specific symbol
export async function fetchLivePrice(
  symbol: string
): Promise<DetailedPriceResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/prices/live/${encodeURIComponent(symbol)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching live price for ${symbol}:`, error);
    throw error;
  }
}

// Fetch price history for a specific symbol
export async function fetchPriceHistory(
  symbol: string,
  options: { limit?: number; hours?: number } = {}
): Promise<PriceHistoryResponse> {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.hours) params.append("hours", options.hours.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/prices/history/${encodeURIComponent(symbol)}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching price history for ${symbol}:`, error);
    throw error;
  }
}

// Helper function to get underlying price for options calculations
export async function getUnderlyingPrice(symbol: string): Promise<number> {
  try {
    const response = await fetchLivePrice(symbol);
    return response.data.price;
  } catch (error) {
    console.error(`Error getting underlying price for ${symbol}:`, error);
    return -69; // Fallback value as specified
  }
}
