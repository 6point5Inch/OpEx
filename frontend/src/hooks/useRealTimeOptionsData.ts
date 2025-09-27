import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { getWebSocketManager, OptionUpdate } from "@/utils/websocket";
import { OptionsData } from "@/types/options";
import { ProcessedOptionData, ApiOptionResponse } from "@/types/api";

interface UseRealTimeOptionsDataReturn {
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
  isConnected: boolean;
  refetch: () => Promise<void>;
  applyFilters: (underlyingAsset?: string, expiryPeriod?: string) => void;
}

export function useRealTimeOptionsData(): UseRealTimeOptionsDataReturn {
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
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Store current filters to reapply after updates
  const filtersRef = useRef<{
    underlyingAsset?: string;
    expiryPeriod?: string;
  }>({});
  const wsManagerRef = useRef(getWebSocketManager());

  // Process and set filtered data with smooth updates
  const processAndSetData = useCallback(
    (apiData: ApiOptionResponse[], skipLoadingState = false) => {
      if (!skipLoadingState) {
        setLoading(true);
      }

      try {
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

        // Update state smoothly to prevent UI shifts
        setProcessedData((prev) => {
          // If structure is the same, preserve array reference for React optimization
          if (
            prev.length === processed.length &&
            JSON.stringify(prev.map((p) => p.strikePrice)) ===
              JSON.stringify(processed.map((p) => p.strikePrice))
          ) {
            return processed;
          }
          return processed;
        });

        setData(legacy);
        setUnderlyingPrice(currentPrice);
        setExpirationDate(expDate);
        setTimeToExpiry(timeLeft);
        setError(null);
      } catch (err) {
        console.error("Error processing options data:", err);
        if (!skipLoadingState) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to process options data"
          );
        }
      } finally {
        if (!skipLoadingState) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Fetch initial data from REST API
  const fetchData = useCallback(
    async (skipLoadingState = false) => {
      if (!skipLoadingState) {
        setLoading(true);
        setError(null);
      }

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

        // Apply current filters
        const { underlyingAsset, expiryPeriod } = filtersRef.current;
        let filteredData = [...apiData];

        if (underlyingAsset) {
          filteredData = filterByUnderlyingAsset(filteredData, underlyingAsset);
        }
        if (expiryPeriod) {
          filteredData = filterByExpiryPeriod(filteredData, expiryPeriod);
        }

        processAndSetData(filteredData, skipLoadingState);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch options data";
        setError(errorMessage);
        console.error("Error in useRealTimeOptionsData:", err);

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
        if (!skipLoadingState) {
          setLoading(false);
        }
      }
    },
    [processAndSetData]
  );

  // Handle real-time option updates
  const handleOptionUpdate = useCallback(
    (update: OptionUpdate) => {
      setRawData((prevRawData) => {
        // Find and update the specific option in raw data
        const updatedRawData = prevRawData.map((option) => {
          if (option.instrument_name === update.data.instrument_name) {
            return {
              ...option,
              heston_price: update.data.heston_price,
              timestamp: update.data.timestamp,
            };
          }
          return option;
        });

        // Apply current filters to updated data
        const { underlyingAsset, expiryPeriod } = filtersRef.current;
        let filteredData = [...updatedRawData];

        if (underlyingAsset) {
          filteredData = filterByUnderlyingAsset(filteredData, underlyingAsset);
        }
        if (expiryPeriod) {
          filteredData = filterByExpiryPeriod(filteredData, expiryPeriod);
        }

        // Process data without loading state to keep UI smooth
        processAndSetData(filteredData, true);

        return updatedRawData;
      });
    },
    [processAndSetData]
  );

  // Apply filters to the raw data
  const applyFilters = useCallback(
    (underlyingAsset?: string, expiryPeriod?: string) => {
      // Store current filters
      filtersRef.current = { underlyingAsset, expiryPeriod };

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
      processAndSetData(filteredData, true);
    },
    [rawData, processAndSetData]
  );

  // Setup WebSocket event handlers
  useEffect(() => {
    const wsManager = wsManagerRef.current;

    wsManager.setEventHandlers({
      onConnect: () => {
        console.log("🔌 Options WebSocket connected");
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log("🔌 Options WebSocket disconnected");
        setIsConnected(false);
      },
      onUpdate: handleOptionUpdate,
      onError: (error) => {
        console.error("🔌 Options WebSocket error:", error);
        setError("WebSocket connection error");
      },
    });

    return () => {
      // Don't disconnect on unmount, keep connection alive for other components
    };
  }, [handleOptionUpdate]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Periodic data refresh every 3 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true); // Skip loading state for periodic updates
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
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
      isConnected,
      refetch: () => fetchData(),
      applyFilters,
    }),
    [
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
      isConnected,
      fetchData,
      applyFilters,
    ]
  );
}
