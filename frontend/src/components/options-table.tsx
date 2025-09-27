"use client";

import React, { useState, useCallback } from "react";
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
  onOptionDoubleClick: (option: SelectedOption) => void;
  underlyingPrice: number;
  expirationDate: string;
  timeToExpiry: string;
}

export function OptionsTable({
  data,
  selectedOption,
  onOptionSelect,
  onOptionDoubleClick,
  underlyingPrice,
  expirationDate,
  timeToExpiry,
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

  const handleCellDoubleClick = useCallback(
    (
      strikePrice: number,
      optionType: OptionType,
      data: OptionsData["calls"] | OptionsData["puts"]
    ) => {
      const option: SelectedOption = {
        strikePrice,
        type: optionType,
        side: "buy",
        data,
        instrumentName: data.instrumentName,
      };
      onOptionDoubleClick(option);
    },
    [onOptionDoubleClick]
  );

  const isInTheMoney = useCallback(
    (strikePrice: number, optionType: OptionType): boolean => {
      return optionType === "call"
        ? underlyingPrice > strikePrice
        : underlyingPrice < strikePrice;
    },
    [underlyingPrice]
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">
            Options Chain - ETH/USDC
          </CardTitle>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Expiry: {expirationDate}</span>
            <span>Time: {timeToExpiry}</span>
            <span>
              Underlying:{" "}
              {underlyingPrice === -69 ? "-" : `$${underlyingPrice.toFixed(4)}`}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Call Options Headers */}
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Δ
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Size
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  IV Bid
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Bid
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Mark
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Ask
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  IV Ask
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Size
                </TableHead>
                <TableHead className="text-center text-green-600 dark:text-green-400">
                  Pos
                </TableHead>

                {/* Strike Price */}
                <TableHead className="text-center font-bold border-x-2 border-border bg-muted/20">
                  Strike
                </TableHead>

                {/* Put Options Headers */}
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Pos
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Size
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  IV Bid
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Bid
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Mark
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Ask
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  IV Ask
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Size
                </TableHead>
                <TableHead className="text-center text-red-600 dark:text-red-400">
                  Δ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow
                  key={`${row.strikePrice}-${
                    row.calls.instrumentName || index
                  }-${row.puts.instrumentName || index}`}
                  className="hover:bg-transparent"
                >
                  {/* Call Options Cells */}
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.delta)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.size)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatPercentage(row.calls.ivBid)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.bid)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    <span className="font-semibold">
                      {formatNumber(row.calls.mark)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.ask)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatPercentage(row.calls.ivAsk)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.size2)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "call")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "call", row.calls)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "call", row.calls)
                    }
                  >
                    {formatNumber(row.calls.position)}
                  </TableCell>

                  {/* Strike Price Column */}
                  <TableCell className="text-center font-bold border-x-2 border-border bg-muted/20 relative">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "text-lg font-bold",
                          isInTheMoney(row.strikePrice, "call") ||
                            isInTheMoney(row.strikePrice, "put")
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatNumber(row.strikePrice, 6)}
                      </span>
                      {isInTheMoney(row.strikePrice, "call") ||
                      isInTheMoney(row.strikePrice, "put") ? (
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 bg-yellow-100 dark:bg-yellow-900/20"
                        >
                          ITM
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>

                  {/* Put Options Cells */}
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.position)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.size)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatPercentage(row.puts.ivBid)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.bid)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    <span className="font-semibold">
                      {formatNumber(row.puts.mark)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.ask)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatPercentage(row.puts.ivAsk)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.size2)}
                  </TableCell>
                  <TableCell
                    className={getCellClassName(row.strikePrice, "put")}
                    onClick={() =>
                      handleCellClick(row.strikePrice, "put", row.puts)
                    }
                    onDoubleClick={() =>
                      handleCellDoubleClick(row.strikePrice, "put", row.puts)
                    }
                  >
                    {formatNumber(row.puts.delta)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
