import { useState, useEffect, useCallback, useRef } from "react";
import { fetchOptionHistory, processHistoryDataForChart } from "@/utils/api";
import {
  getWebSocketManager,
  OptionHistory,
  OptionUpdate,
} from "@/utils/websocket";
import { ChartDataPoint } from "@/types/api";

interface UseRealTimeChartDataReturn {
  chartData: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  subscribe: (instrument: string) => void;
  unsubscribe: () => void;
  refetch: (instrument: string) => Promise<void>;
}

export function useRealTimeChartData(): UseRealTimeChartDataReturn {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const currentInstrumentRef = useRef<string | null>(null);
  const wsManagerRef = useRef(getWebSocketManager());

  // Fetch initial historical data
  const fetchData = useCallback(
    async (instrumentName: string, skipLoadingState = false) => {
      if (!instrumentName) {
        setChartData([]);
        return;
      }

      if (!skipLoadingState) {
        setLoading(true);
        setError(null);
      }

      try {
        const historyData = await fetchOptionHistory(instrumentName);
        const processedChartData = processHistoryDataForChart(historyData);

        setChartData(processedChartData);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch option history";
        if (!skipLoadingState) {
          setError(errorMessage);
        }
        console.error("Error in useRealTimeChartData:", err);

        // Set fallback empty data on error
        if (!skipLoadingState) {
          setChartData([]);
        }
      } finally {
        if (!skipLoadingState) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Handle historical data from WebSocket
  const handleHistoryData = useCallback((history: OptionHistory) => {
    if (history.instrument !== currentInstrumentRef.current) {
      return; // Ignore updates for different instruments
    }

    try {
      const processedChartData = processHistoryDataForChart(history.data);
      setChartData(processedChartData);
      setError(null);
    } catch (err) {
      console.error("Error processing WebSocket history data:", err);
    }
  }, []);

  // Handle real-time updates from WebSocket
  const handleRealtimeUpdate = useCallback((update: OptionUpdate) => {
    if (update.instrument !== currentInstrumentRef.current) {
      return; // Ignore updates for different instruments
    }

    setChartData((prevData: ChartDataPoint[]) => {
      const updateTime = new Date(update.data.timestamp).getTime();
      const timeInterval = 10 * 1000; // 60 seconds in milliseconds
      const intervalStart =
        Math.floor(updateTime / timeInterval) * timeInterval;
      const intervalTimestamp = new Date(intervalStart).toISOString();

      // Find the candle for this 60-second interval
      const existingIndex = prevData.findIndex((point: ChartDataPoint) => {
        const pointInterval =
          Math.floor(new Date(point.timestamp).getTime() / timeInterval) *
          timeInterval;
        return pointInterval === intervalStart;
      });

      if (existingIndex >= 0) {
        // Update existing candle with new price data
        const updatedData = [...prevData];
        const existingCandle = updatedData[existingIndex];

        updatedData[existingIndex] = {
          ...existingCandle,
          close: update.data.heston_price, // Always update close to latest price
          high: Math.max(existingCandle.high, update.data.heston_price),
          low: Math.min(existingCandle.low, update.data.heston_price),
          timestamp: intervalTimestamp, // Keep consistent interval timestamp
          date: new Date(intervalStart),
        };
        return updatedData;
      } else {
        // Create new candle for this 10-second interval
        const newCandle: ChartDataPoint = {
          timestamp: intervalTimestamp,
          date: new Date(intervalStart),
          open: update.data.heston_price,
          high: update.data.heston_price,
          low: update.data.heston_price,
          close: update.data.heston_price,
        };

        // Add new candle and keep only last 100 points for performance
        const updatedData = [...prevData, newCandle].slice(-100);
        return updatedData.sort((a, b) => a.date.getTime() - b.date.getTime());
      }
    });
  }, []);

  // Subscribe to real-time updates for an instrument
  const subscribe = useCallback(
    (instrument: string) => {
      if (!instrument) return;

      // Unsubscribe from previous instrument
      if (currentInstrumentRef.current) {
        wsManagerRef.current.unsubscribe(currentInstrumentRef.current);
      }

      currentInstrumentRef.current = instrument;

      // Fetch initial data
      fetchData(instrument);

      // Subscribe to WebSocket updates
      wsManagerRef.current.subscribe(instrument);
    },
    [fetchData]
  );

  // Unsubscribe from current instrument
  const unsubscribe = useCallback(() => {
    if (currentInstrumentRef.current) {
      wsManagerRef.current.unsubscribe(currentInstrumentRef.current);
      currentInstrumentRef.current = null;
    }
    setChartData([]);
  }, []);

  // Setup WebSocket event handlers
  useEffect(() => {
    const wsManager = wsManagerRef.current;

    wsManager.setEventHandlers({
      onConnect: () => {
        console.log("📈 Chart WebSocket connected");
        setIsConnected(true);

        // Resubscribe to current instrument if exists
        if (currentInstrumentRef.current) {
          wsManager.subscribe(currentInstrumentRef.current);
        }
      },
      onDisconnect: () => {
        console.log("📈 Chart WebSocket disconnected");
        setIsConnected(false);
      },
      onHistory: handleHistoryData,
      onUpdate: handleRealtimeUpdate,
      onError: (error: string) => {
        console.error("📈 Chart WebSocket error:", error);
        setError("WebSocket connection error");
      },
    });

    // Cleanup function
    return () => {
      // Don't disconnect WebSocket as it might be used by other components
      // Just unsubscribe from current instrument
      if (currentInstrumentRef.current) {
        wsManager.unsubscribe(currentInstrumentRef.current);
      }
    };
  }, [handleHistoryData, handleRealtimeUpdate]);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(wsManagerRef.current.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    chartData,
    loading,
    error,
    isConnected,
    subscribe,
    unsubscribe,
    refetch: fetchData,
  };
}
