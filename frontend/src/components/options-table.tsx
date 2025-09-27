"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OptionsData, SelectedOption, OptionType } from "@/types/options";

interface OptionsTableProps {
  data: OptionsData[];
  selectedOption: SelectedOption | null;
  onOptionSelect: (option: SelectedOption) => void;
  underlyingPrice: number;
  livePrice: number;
}

export function OptionsTable({
  data,
  selectedOption,
  onOptionSelect,
  underlyingPrice,
  livePrice,
}: OptionsTableProps) {
  const formatNumber = useCallback(
    (value: number, decimals: number = 8): string => {
      if (value === 0 || value === -69) return "-";
      return value.toFixed(decimals);
    },
    []
  );

  const formatPercentage = useCallback((value: number): string => {
    if (value === 0 || value === -69) return "-";
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  const getCellClassName = useCallback(
    (
      strikePrice: number,
      optionType: OptionType,
      isSelectable: boolean = true
    ): string => {
      const isSelected =
        selectedOption?.strikePrice === strikePrice &&
        selectedOption?.type === optionType;

      return cn("transition-colors cursor-pointer text-center relative", {
        "bg-green-100 dark:bg-green-900/20 border-green-500":
          isSelected && optionType === "call",
        "bg-red-100 dark:bg-red-900/20 border-red-500":
          isSelected && optionType === "put",
        "hover:bg-muted/50": isSelectable,
        "border-2": isSelected,
      });
    },
    [selectedOption]
  );

  const handleCellClick = useCallback(
    (
      strikePrice: number,
      optionType: OptionType,
      data: OptionsData["calls"] | OptionsData["puts"]
    ) => {
      const option: SelectedOption = {
        strikePrice,
        type: optionType,
        side: "buy", // Default to buy, can be changed in modal
        data,
        instrumentName: data.instrumentName,
      };
      onOptionSelect(option);
    },
    [onOptionSelect]
  );

  const isInTheMoney = useCallback(
    (strikePrice: number, optionType: OptionType): boolean => {
      return optionType === "call"
        ? underlyingPrice > strikePrice
        : underlyingPrice < strikePrice;
    },
    [underlyingPrice]
  );

  // Find the nearest strike price to the live price
  const findNearestStrike = useCallback((): number => {
    if (!data.length || livePrice === -69) return 0;

    const strikes = data.map((row) => row.strikePrice).sort((a, b) => a - b);
    let nearestStrike = strikes[0];
    let minDiff = Math.abs(livePrice - nearestStrike);

    for (const strike of strikes) {
      const diff = Math.abs(livePrice - strike);
      if (diff < minDiff) {
        minDiff = diff;
        nearestStrike = strike;
      }
    }

    return nearestStrike;
  }, [data, livePrice]);

  // Filter data to show 7 strikes above and 7 below the nearest strike
  const filteredData = useMemo(() => {
    if (!data.length) return data;

    const nearestStrike = findNearestStrike();
    if (nearestStrike === 0) return data;

    // Sort all data by strike price
    const sortedData = [...data].sort((a, b) => a.strikePrice - b.strikePrice);

    // Find the index of the nearest strike
    const nearestIndex = sortedData.findIndex(
      (row) => row.strikePrice === nearestStrike
    );
    if (nearestIndex === -1) return data;

    // Get 7 strikes above and 7 below (15 total strikes centered around the nearest)
    const startIndex = Math.max(0, nearestIndex - 7);
    const endIndex = Math.min(sortedData.length, nearestIndex + 8); // +8 to include 7 above

    return sortedData.slice(startIndex, endIndex);
  }, [data, findNearestStrike]);

  // Check if a strike is the nearest to the live price
  const isNearestStrike = useCallback(
    (strikePrice: number): boolean => {
      const nearestStrike = findNearestStrike();
      return strikePrice === nearestStrike && livePrice !== -69;
    },
    [findNearestStrike, livePrice]
  );

  // Enhanced cell className to include nearest strike highlighting
  const getEnhancedCellClassName = useCallback(
    (
      strikePrice: number,
      optionType: OptionType,
      isSelectable: boolean = true
    ): string => {
      const baseClassName = getCellClassName(
        strikePrice,
        optionType,
        isSelectable
      );
      const isNearest = isNearestStrike(strikePrice);

      if (isNearest) {
        return cn(
          baseClassName,
          "ring-2 ring-yellow-400 dark:ring-yellow-500",
          "bg-yellow-50 dark:bg-yellow-900/30",
          "font-semibold"
        );
      }

      return baseClassName;
    },
    [getCellClassName, isNearestStrike]
  );

  return (
    <div className="w-full h-full">
      <Card className="h-full w-full overflow-hidden flex flex-col py-0">
        <CardContent className="flex-1 overflow-auto p-0 relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                {/* Call Options Headers */}
                <TableHead className="text-center text-green-600 dark:text-green-400 px-2 py-2 text-xs">
                  Bid
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400 px-2 py-2 text-xs">
                  Mark
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400 px-2 py-2 text-xs">
                  Ask
                </TableHead>

                {/* Strike Price */}
                <TableHead className="text-center font-bold border-x-2 border-border bg-muted/20 px-2 py-2 text-sm">
                  Strike
                </TableHead>

                {/* Put Options Headers */}
                <TableHead className="text-center text-red-600 dark:text-red-400 px-2 py-2 text-xs">
                  Bid
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400 px-2 py-2 text-xs">
                  Mark
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400 px-2 py-2 text-xs">
                  Ask
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow
                  key={`${row.strikePrice}-${
                    row.calls.instrumentName || index
                  }-${row.puts.instrumentName || index}`}
                  className="hover:bg-transparent"
                >
                  {/* Call Options Cells */}
                  <TableCell
                    className={getEnhancedCellClassName(
                      row.strikePrice,
                      "call"
                    )}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.bid)}
                  </TableCell>
                  <TableCell
                    className={getEnhancedCellClassName(
                      row.strikePrice,
                      "call"
                    )}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    <span className="font-semibold">
                      {formatNumber(row.calls.mark)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={getEnhancedCellClassName(
                      row.strikePrice,
                      "call"
                    )}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.ask)}
                  </TableCell>

                  {/* Strike Price Column */}
                  <TableCell
                    className={cn(
                      "text-center font-bold border-x-2 border-border bg-muted/20 relative py-1.5 px-2",
                      isNearestStrike(row.strikePrice) &&
                        "bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 dark:ring-yellow-500"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "text-base font-bold",
                          isNearestStrike(row.strikePrice)
                            ? "text-yellow-800 dark:text-yellow-200"
                            : isInTheMoney(row.strikePrice, "call") ||
                              isInTheMoney(row.strikePrice, "put")
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatNumber(row.strikePrice, 6)}
                      </span>
                      <div className="flex gap-1 mt-1 scale-75">
                        {isNearestStrike(row.strikePrice) && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-200 dark:bg-yellow-800/40 text-yellow-800 dark:text-yellow-200 border-yellow-400"
                          >
                            NEAREST
                          </Badge>
                        )}
                        {/* {(isInTheMoney(row.strikePrice, "call") ||
                          isInTheMoney(row.strikePrice, "put")) && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-100 dark:bg-yellow-900/20"
                          >
                            ITM
                          </Badge>
                        )} */}
                      </div>
                    </div>
                  </TableCell>

                  {/* Put Options Cells */}
                  <TableCell
                    className={getEnhancedCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.bid)}
                  </TableCell>
                  <TableCell
                    className={getEnhancedCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    <span className="font-semibold">
                      {formatNumber(row.puts.mark)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={getEnhancedCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.ask)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
