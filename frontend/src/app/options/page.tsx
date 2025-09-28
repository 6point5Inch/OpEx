"use client";

import React, { useState, useEffect } from "react";
import { OptionsTable } from "@/components/options-table";
import { useRealTimeOptionsData } from "@/hooks/useRealTimeOptionsData";
import { useLivePrices } from "@/hooks/useLivePrices";
import { SelectedOption } from "@/types/options";
import { Button } from "@/components/ui/button";
import { OptionChart } from "@/components/option-chart";
import { TradePanel } from "@/components/trade-panel";
import {
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function Options() {
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(
    null
  );
  const [selectedUnderlyingAsset, setSelectedUnderlyingAsset] =
    useState<string>("1INCH");
  const [selectedExpiryPeriod, setSelectedExpiryPeriod] =
    useState<string>("7d");

  const {
    data,
    underlyingPrice,
    expirationDate,
    timeToExpiry,
    loading,
    error,
    availableUnderlyingAssets,
    availableExpiryPeriods,
    isConnected,
    refetch,
    applyFilters,
  } = useRealTimeOptionsData();

  // Use live prices hook for real-time underlying asset prices
  const {
    prices: livePrices,
    isLoading: pricesLoading,
    error: pricesError,
    lastUpdated: pricesLastUpdated,
    refetch: refetchPrices,
    getPrice,
  } = useLivePrices(true, 5000); // Auto-refresh every 5 seconds

  const handleOptionSelect = (option: SelectedOption) => {
    setSelectedOption(option);
  };

  const handleRefresh = () => {
    refetch();
  };

  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === -69) return "-";
    return value.toFixed(2);
  };

  // Handle filter changes
  const handleUnderlyingAssetChange = (asset: string) => {
    setSelectedUnderlyingAsset(asset);
  };

  const handleExpiryPeriodChange = (period: string) => {
    setSelectedExpiryPeriod(period);
  };

  // Apply filters when they change
  useEffect(() => {
    if (
      availableUnderlyingAssets.length > 0 ||
      availableExpiryPeriods.length > 0
    ) {
      const underlyingAsset = selectedUnderlyingAsset;
      const expiryPeriod = selectedExpiryPeriod;
      applyFilters(underlyingAsset, expiryPeriod);
    }
  }, [
    selectedUnderlyingAsset,
    selectedExpiryPeriod,
    availableUnderlyingAssets,
    availableExpiryPeriods,
    applyFilters,
  ]);

  if (loading && data.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Options Trading</h1>
          <p className="text-muted-foreground">Loading options data...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Options Trading</h1>
          <p className="text-muted-foreground">Failed to load options data</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-500 text-center max-w-md">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 space-y-4 h-screen flex flex-col">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Options Trading
            </h1>
            <p className="text-muted-foreground">
              Select an option to view details and trade.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* WebSocket Connection Status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-xs ${
                  isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>

            {loading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Combined Header: Live Prices & Filters */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center p-4 bg-muted/20 rounded-lg border">
        {/* Left side: Filters */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:space-x-6">
          {/* Underlying Asset Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Asset:
            </label>
            <select
              value={selectedUnderlyingAsset}
              onChange={(e) => handleUnderlyingAssetChange(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              {availableUnderlyingAssets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset === "1INCH"
                    ? "1INCH/USDC"
                    : asset === "ETH"
                    ? "ETH/USDC"
                    : `${asset}/USDC`}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Period Buttons */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Expiry:
            </label>
            <div className="flex space-x-2">
              {availableExpiryPeriods.map((period) => (
                <button
                  key={period}
                  onClick={() => handleExpiryPeriodChange(period)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    selectedExpiryPeriod === period
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Live Prices */}
        <div className="flex flex-col items-start md:items-end space-y-2">
          <div className="flex items-center space-x-4">
            {/* ETH Price */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                ETH:
              </span>
              {pricesLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : pricesError ? (
                <span className="text-red-500 text-sm">Error</span>
              ) : (
                <span className="text-md font-semibold text-green-600">
                  ${getPrice("ETH")?.toFixed(2) || "N/A"}
                </span>
              )}
            </div>

            {/* 1INCH Price */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                1INCH:
              </span>
              {pricesLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : pricesError ? (
                <span className="text-red-500 text-sm">Error</span>
              ) : (
                <span className="text-md font-semibold text-blue-600">
                  ${getPrice("1INCH")?.toFixed(4) || "N/A"}
                </span>
              )}
            </div>
          </div>
          {/* Last Updated */}
          <div className="text-right">
            {pricesLastUpdated && (
              <div className="text-xs text-muted-foreground">
                Updated: {new Date(pricesLastUpdated).toLocaleTimeString()}
              </div>
            )}
            {pricesError && (
              <div className="text-xs text-red-500">Price fetch failed</div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="">
          <OptionsTable
            data={data}
            selectedOption={selectedOption}
            onOptionSelect={handleOptionSelect}
            underlyingPrice={underlyingPrice}
            livePrice={getPrice(selectedUnderlyingAsset) || underlyingPrice}
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex-1">
            <OptionChart
              instrumentName={selectedOption?.instrumentName || null}
            />
          </div>
          <div className="flex-1">
            <TradePanel selectedOption={selectedOption} livePrice={getPrice(selectedUnderlyingAsset) || underlyingPrice} />
          </div>
        </div>
      </main>
    </div>
  );
}
