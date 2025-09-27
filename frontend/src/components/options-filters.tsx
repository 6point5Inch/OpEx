"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface OptionsFiltersProps {
  availableUnderlyingAssets: string[];
  availableExpiryPeriods: string[];
  selectedUnderlyingAsset: string;
  selectedExpiryPeriod: string;
  onUnderlyingAssetChange: (asset: string) => void;
  onExpiryPeriodChange: (period: string) => void;
}

export function OptionsFilters({
  availableUnderlyingAssets,
  availableExpiryPeriods,
  selectedUnderlyingAsset,
  selectedExpiryPeriod,
  onUnderlyingAssetChange,
  onExpiryPeriodChange,
}: OptionsFiltersProps) {
  // Format asset pair for display
  const formatAssetPair = (asset: string): string => {
    // Assuming the second asset is always USDC for display
    if (asset === "1INCH") {
      return "1INCH/USDC";
    } else if (asset === "ETH") {
      return "ETH/USDC";
    }
    return `${asset}/USDC`;
  };

  // Format expiry period for display
  const formatExpiryPeriod = (period: string): string => {
    return period.toUpperCase(); // "7d" -> "7D", "30d" -> "30D"
  };

  return (
    <Card className="w-full mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6 md:items-center">
          {/* Underlying Asset Dropdown */}
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Options Chain:
            </label>
            <Select
              value={selectedUnderlyingAsset}
              onValueChange={onUnderlyingAssetChange}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select asset pair" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {availableUnderlyingAssets.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {formatAssetPair(asset)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Period Tabs */}
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:items-center">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Expiry:
            </label>
            <Tabs
              value={selectedExpiryPeriod}
              onValueChange={onExpiryPeriodChange}
              className="w-full md:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 md:w-auto">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                {availableExpiryPeriods.map((period) => (
                  <TabsTrigger key={period} value={period} className="text-xs">
                    {formatExpiryPeriod(period)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
                      {formatAssetPair(selectedUnderlyingAsset)}
                    </span>
                  )}
                  {selectedUnderlyingAsset !== "all" &&
                    selectedExpiryPeriod !== "all" &&
                    " • "}
                  {selectedExpiryPeriod !== "all" && (
                    <span className="font-medium">
                      {formatExpiryPeriod(selectedExpiryPeriod)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
