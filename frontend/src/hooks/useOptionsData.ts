import { useState, useEffect, useCallback } from "react";
import {
  fetchOptionsData,
  processOptionsData,
  convertToLegacyFormat,
  getCurrentUnderlyingPrice,
  formatExpirationDate,
  calculateTimeToExpiry,
} from "@/utils/api";
import { OptionsData } from "@/types/options";
import { ProcessedOptionData } from "@/types/api";

interface UseOptionsDataReturn {
  data: OptionsData[];
  processedData: ProcessedOptionData[];
  underlyingPrice: number;
  expirationDate: string;
  timeToExpiry: string;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOptionsData(): UseOptionsDataReturn {
  const [data, setData] = useState<OptionsData[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedOptionData[]>([]);
  const [underlyingPrice, setUnderlyingPrice] = useState<number>(0.214);
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [timeToExpiry, setTimeToExpiry] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch raw options data from API
      const apiData = await fetchOptionsData();

      if (apiData.length === 0) {
        throw new Error("No options data available");
      }

      // Process the data
      const processed = processOptionsData(apiData);
      const legacy = convertToLegacyFormat(processed);

      // Calculate derived values
      const currentPrice = getCurrentUnderlyingPrice(processed);

      // Get expiration info from the first available option
      const firstOption = processed[0];
      const expDate = formatExpirationDate(firstOption.expirationDate);
      const timeLeft = calculateTimeToExpiry(firstOption.expirationDate);

      // Update state
      setProcessedData(processed);
      setData(legacy);
      setUnderlyingPrice(currentPrice);
      setExpirationDate(expDate);
      setTimeToExpiry(timeLeft);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch options data";
      setError(errorMessage);
      console.error("Error in useOptionsData:", err);

      // Set fallback data on error
      setData([]);
      setProcessedData([]);
      setUnderlyingPrice(0.214);
      setExpirationDate("N/A");
      setTimeToExpiry("N/A");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    processedData,
    underlyingPrice,
    expirationDate,
    timeToExpiry,
    loading,
    error,
    refetch: fetchData,
  };
}
