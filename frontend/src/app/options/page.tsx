"use client";

import React, { useState } from "react";
import { OptionsTable } from "@/components/options-table";
import { TradeModal } from "@/components/trade-modal";
import { useOptionsData } from "@/hooks/useOptionsData";
import { SelectedOption } from "@/types/options";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

export default function Options() {
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(
    null
  );
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const {
    data,
    underlyingPrice,
    expirationDate,
    timeToExpiry,
    loading,
    error,
    refetch,
  } = useOptionsData();

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
