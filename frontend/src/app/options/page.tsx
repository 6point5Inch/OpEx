"use client";

import React, { useState, useEffect } from "react";
import { OptionsTable } from "@/components/options-table";
import { TradeModal } from "@/components/trade-modal";
import { useOptionsData } from "@/hooks/useOptionsData";
import { useLivePrices } from "@/hooks/useLivePrices";
import { SelectedOption } from "@/types/options";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, TrendingUp } from "lucide-react";

export default function Options() {
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(
    null
  );
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedUnderlyingAsset, setSelectedUnderlyingAsset] =
    useState<string>("all");
  const [selectedExpiryPeriod, setSelectedExpiryPeriod] =
    useState<string>("all");

  const {
    data,
    underlyingPrice,
    expirationDate,
    timeToExpiry,
    loading,
    error,
    availableUnderlyingAssets,
    availableExpiryPeriods,
    refetch,
    applyFilters,
  } = useOptionsData();

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

  const handleOptionDoubleClick = (option: SelectedOption) => {
    setSelectedOption(option);
    setIsTradeModalOpen(true);
  };

  const handleCloseTradeModal = () => {
    setIsTradeModalOpen(false);
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
      const underlyingAsset =
        selectedUnderlyingAsset === "all" ? undefined : selectedUnderlyingAsset;
      const expiryPeriod =
        selectedExpiryPeriod === "all" ? undefined : selectedExpiryPeriod;
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Options Trading
            </h1>
            <p className="text-muted-foreground">
              Select an option to view details or double-click to open the trade
              modal.
            </p>
          </div>
          <div className="flex items-center space-x-2">
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

      {/* Live Prices Display */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-muted-foreground">
            Live Prices:
          </span>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-6">
          {/* ETH Price */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">ETH:</span>
            {pricesLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : pricesError ? (
              <span className="text-red-500 text-sm">Error</span>
            ) : (
              <span className="text-lg font-bold text-green-600">
                ${getPrice("ETH")?.toFixed(2) || "N/A"}
              </span>
            )}
          </div>

          {/* 1INCH Price */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">1INCH:</span>
            {pricesLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : pricesError ? (
              <span className="text-red-500 text-sm">Error</span>
            ) : (
              <span className="text-lg font-bold text-blue-600">
                ${getPrice("1INCH")?.toFixed(4) || "N/A"}
              </span>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex-1 text-right">
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

      {/* Filter Controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 md:items-center p-4 bg-muted/20 rounded-lg border">
        {/* Underlying Asset Dropdown */}
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Options Chain:
          </label>
          <select
            value={selectedUnderlyingAsset}
            onChange={(e) => handleUnderlyingAssetChange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Assets</option>
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
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Expiry:
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExpiryPeriodChange("all")}
              className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                selectedExpiryPeriod === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              All
            </button>
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

        {/* Selected Filters Display */}
        <div className="flex-1 text-right">
          <div className="text-xs text-muted-foreground">
            {selectedUnderlyingAsset === "all" &&
            selectedExpiryPeriod === "all" ? (
              "Showing all options"
            ) : (
              <>
                Filtered by:{" "}
                {selectedUnderlyingAsset !== "all" && (
                  <span className="font-medium">
                    {selectedUnderlyingAsset === "1INCH"
                      ? "1INCH/USDC"
                      : selectedUnderlyingAsset === "ETH"
                      ? "ETH/USDC"
                      : `${selectedUnderlyingAsset}/USDC`}
                  </span>
                )}
                {selectedUnderlyingAsset !== "all" &&
                  selectedExpiryPeriod !== "all" &&
                  " • "}
                {selectedExpiryPeriod !== "all" && (
                  <span className="font-medium">
                    {selectedExpiryPeriod.toUpperCase()}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <OptionsTable
        data={data}
        selectedOption={selectedOption}
        onOptionSelect={handleOptionSelect}
        onOptionDoubleClick={handleOptionDoubleClick}
        underlyingPrice={underlyingPrice}
        expirationDate={expirationDate}
        timeToExpiry={timeToExpiry}
      />

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={handleCloseTradeModal}
        selectedOption={selectedOption}
      />

      {selectedOption && (
        <div className="mt-6 p-4 bg-muted/20 rounded-lg border">
          <h3 className="font-semibold mb-2">Selected Option Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-medium capitalize">
                {selectedOption.type}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Strike:</span>
              <span className="ml-2 font-medium">
                ${selectedOption.strikePrice}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Mark:</span>
              <span className="ml-2 font-medium">
                ${formatValue(selectedOption.data.mark)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Delta:</span>
              <span className="ml-2 font-medium">
                {formatValue(selectedOption.data.delta)}
              </span>
            </div>
            {selectedOption.instrumentName && (
              <div className="col-span-2 md:col-span-4">
                <span className="text-muted-foreground">Instrument:</span>
                <span className="ml-2 font-medium font-mono text-xs">
                  {selectedOption.instrumentName}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
