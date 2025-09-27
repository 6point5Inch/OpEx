"use client";

import React, { useEffect } from "react";
import { Chart } from "react-google-charts";
import { useRealTimeChartData } from "@/hooks/useRealTimeChartData";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OptionChartProps {
  instrumentName: string | null;
}

const getChartOptions = (isDark: boolean = false) => ({
  legend: "none",
  bar: { groupWidth: "100%" },
  candlestick: {
    fallingColor: { strokeWidth: 0, fill: "#ef4444" }, // red
    risingColor: { strokeWidth: 0, fill: "#22c55e" }, // green
  },
  backgroundColor: "transparent",
  hAxis: {
    textStyle: { color: isDark ? "#9ca3af" : "#666" },
    gridlines: { color: "transparent" },
  },
  vAxis: {
    textStyle: { color: isDark ? "#9ca3af" : "#666" },
    gridlines: { color: isDark ? "#374151" : "#e5e7eb" },
  },
  chartArea: {
    left: 50,
    top: 10,
    width: "90%",
    height: "85%",
  },
});

export function OptionChart({ instrumentName }: OptionChartProps) {
  const { chartData, loading, error, isConnected, subscribe, unsubscribe } =
    useRealTimeChartData();

  useEffect(() => {
    if (instrumentName) {
      subscribe(instrumentName);
    }
    return () => {
      if (instrumentName) {
        unsubscribe();
      }
    };
  }, [instrumentName, subscribe, unsubscribe]);

  if (!instrumentName) {
    return (
      <Card className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p>Select an option to view its chart.</p>
        </div>
      </Card>
    );
  }

  const googleChartsData = [
    ["Time", "Low", "Open", "Close", "High"],
    ...chartData.map((point) => [
      point.date.toLocaleTimeString(),
      point.low,
      point.open,
      point.close,
      point.high,
    ]),
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
        <CardTitle className="text-sm font-medium">Price Chart</CardTitle>
        <div className="flex items-center space-x-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs ${
              isConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {loading && (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading chart...</span>
            </div>
          </div>
        )}
        {!loading && (error || chartData.length === 0) && (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <span className="text-sm text-center">
                {error || "No chart data available"}
              </span>
            </div>
          </div>
        )}
        {!loading && !error && chartData.length > 0 && (
          <Chart
            chartType="CandlestickChart"
            width="100%"
            height="100%"
            data={googleChartsData}
            options={getChartOptions(true)}
          />
        )}
      </CardContent>
    </Card>
  );
}
