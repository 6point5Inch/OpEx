import { useState, useEffect, useCallback } from "react";
import { fetchOptionHistory, processHistoryDataForChart } from "@/utils/api";
import { ChartDataPoint } from "@/types/api";

interface UseOptionHistoryReturn {
  chartData: ChartDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: (instrument: string) => Promise<void>;
}

export function useOptionHistory(instrument?: string): UseOptionHistoryReturn {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (instrumentName: string) => {
    if (!instrumentName) {
      setChartData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const historyData = await fetchOptionHistory(instrumentName);
      const processedChartData = processHistoryDataForChart(historyData);

      setChartData(processedChartData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch option history";
      setError(errorMessage);
      console.error("Error in useOptionHistory:", err);

      // Set fallback empty data on error
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data when instrument changes
  useEffect(() => {
    if (instrument) {
      fetchData(instrument);
    } else {
      setChartData([]);
      setLoading(false);
      setError(null);
    }
  }, [instrument, fetchData]);

  return {
    chartData,
    loading,
    error,
    refetch: fetchData,
  };
}
