import { useState, useEffect, useCallback } from "react";
import {
  fetchOptionsData,
  processOptionsData,
  convertToLegacyFormat,
  getCurrentUnderlyingPrice,
  formatExpirationDate,
  calculateTimeToExpiry,
  filterByUnderlyingAsset,
  filterByExpiryPeriod,
  getUniqueUnderlyingAssets,
  getUniqueExpiryPeriods,
} from "@/utils/api";
import { OptionsData } from "@/types/options";
import { ProcessedOptionData, ApiOptionResponse } from "@/types/api";

interface UseOptionsDataReturn {
  data: OptionsData[];
  processedData: ProcessedOptionData[];
  rawData: ApiOptionResponse[];
  underlyingPrice: number;
  expirationDate: string;
  timeToExpiry: string;
  loading: boolean;
  error: string | null;
  availableUnderlyingAssets: string[];
  availableExpiryPeriods: string[];
  refetch: () => Promise<void>;
  applyFilters: (underlyingAsset?: string, expiryPeriod?: string) => void;
}

export function useOptionsData(): UseOptionsDataReturn {
  const [data, setData] = useState<OptionsData[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedOptionData[]>([]);
  const [rawData, setRawData] = useState<ApiOptionResponse[]>([]);
  const [underlyingPrice, setUnderlyingPrice] = useState<number>(0.214);
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [timeToExpiry, setTimeToExpiry] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [availableUnderlyingAssets, setAvailableUnderlyingAssets] = useState<
    string[]
  >([]);
  const [availableExpiryPeriods, setAvailableExpiryPeriods] = useState<
    string[]
  >([]);

  // Process and set filtered data
  const processAndSetData = useCallback((apiData: ApiOptionResponse[]) => {
    if (apiData.length === 0) {
      setData([]);
      setProcessedData([]);
      setUnderlyingPrice(0.214);
      setExpirationDate("N/A");
      setTimeToExpiry("N/A");
      return;
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
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch raw options data from API
      const apiData = await fetchOptionsData();

      if (apiData.length === 0) {
        throw new Error("No options data available");
      }

      // Store raw data
      setRawData(apiData);

      // Get available filter options
      const assets = getUniqueUnderlyingAssets(apiData);
      const periods = getUniqueExpiryPeriods(apiData);
      setAvailableUnderlyingAssets(assets);
      setAvailableExpiryPeriods(periods);

      // Process with no filters initially (show all data)
      processAndSetData(apiData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch options data";
      setError(errorMessage);
      console.error("Error in useOptionsData:", err);

      // Set fallback data on error
      setRawData([]);
      setData([]);
      setProcessedData([]);
      setUnderlyingPrice(0.214);
      setExpirationDate("N/A");
      setTimeToExpiry("N/A");
      setAvailableUnderlyingAssets([]);
      setAvailableExpiryPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [processAndSetData]);

  // Apply filters to the raw data
  const applyFilters = useCallback(
    (underlyingAsset?: string, expiryPeriod?: string) => {
      let filteredData = [...rawData];

      // Apply underlying asset filter
      if (underlyingAsset) {
        filteredData = filterByUnderlyingAsset(filteredData, underlyingAsset);
      }

      // Apply expiry period filter
      if (expiryPeriod) {
        filteredData = filterByExpiryPeriod(filteredData, expiryPeriod);
      }

      // Process the filtered data
      processAndSetData(filteredData);
    },
    [rawData, processAndSetData]
  );

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
    rawData,
    underlyingPrice,
    expirationDate,
    timeToExpiry,
    loading,
    error,
    availableUnderlyingAssets,
    availableExpiryPeriods,
    refetch: fetchData,
    applyFilters,
  };
}
