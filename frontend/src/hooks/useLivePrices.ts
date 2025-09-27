import { useState, useEffect, useCallback } from "react";
import {
  fetchLivePrices,
  fetchLivePrice,
  LivePricesResponse,
  DetailedPriceResponse,
  LivePriceData,
} from "@/utils/api";

export interface UseLivePricesResult {
  prices: Record<string, LivePriceData>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => Promise<void>;
  getPrice: (symbol: string) => number | null;
}

export function useLivePrices(
  autoRefresh = true,
  refreshInterval = 500
): UseLivePricesResult {
  const [prices, setPrices] = useState<Record<string, LivePriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchLivePrices();

      if (response.success) {
        setPrices(response.data);
        setLastUpdated(response.timestamp);
      } else {
        throw new Error("Failed to fetch live prices");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching live prices:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to get price for a specific symbol
  const getPrice = useCallback(
    (symbol: string): number | null => {
      const priceData = prices[symbol.toUpperCase()];
      return priceData ? priceData.price : null;
    },
    [prices]
  );

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  return {
    prices,
    isLoading,
    error,
    lastUpdated,
    refetch,
    getPrice,
  };
}

export interface UseSpecificPriceResult {
  priceData: DetailedPriceResponse["data"] | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  refetch: () => Promise<void>;
}

export function useSpecificPrice(
  symbol: string,
  autoRefresh = true,
  refreshInterval = 5000
): UseSpecificPriceResult {
  const [priceData, setPriceData] = useState<
    DetailedPriceResponse["data"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!symbol) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchLivePrice(symbol);

      if (response.success) {
        setPriceData(response.data);
        setLastUpdated(response.timestamp);
      } else {
        throw new Error(`Failed to fetch price for ${symbol}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error(`Error fetching price for ${symbol}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (!symbol) return;

    refetch();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [symbol, autoRefresh, refreshInterval, refetch]);

  return {
    priceData,
    isLoading,
    error,
    lastUpdated,
    refetch,
  };
}
