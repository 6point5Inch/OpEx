"use client";

import React from "react";
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
import { Holding } from "@/types/holdings";

interface HoldingsTableProps {
  holdings: Holding[];
  selectedHolding: Holding | null;
  onHoldingSelect: (holding: Holding) => void;
}

export function HoldingsTable({
  holdings,
  selectedHolding,
  onHoldingSelect,
}: HoldingsTableProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const getTypeColor = (type: "call" | "put"): string => {
    return type === "call" ? "text-green-600" : "text-red-600";
  };

  const getPnlColor = (pnl: number): string => {
    return pnl >= 0 ? "text-green-600" : "text-red-600";
  };

  const isRowSelected = (holding: Holding): boolean => {
    return selectedHolding?.id === holding.id;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Your Positions</CardTitle>
        <p className="text-sm text-muted-foreground">
          {holdings.length} active position{holdings.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div className="overflow-auto max-h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="text-left font-medium">
                  Instrument
                </TableHead>
                <TableHead className="text-center font-medium">Qty</TableHead>
                <TableHead className="text-center font-medium">
                  Expiry
                </TableHead>
                <TableHead className="text-right font-medium">P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow
                  key={holding.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    isRowSelected(holding) && "bg-muted/70"
                  )}
                  onClick={() => onHoldingSelect(holding)}
                >
                  <TableCell className="py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {holding.instrumentName}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-0.5",
                            getTypeColor(holding.type)
                          )}
                        >
                          {holding.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Strike: ${holding.strikePrice}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className="font-medium">{holding.quantity}</div>
                    <div className="text-xs text-muted-foreground">
                      @${holding.averagePrice.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className="font-medium text-sm">
                      {formatDate(holding.expiryDate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.ceil(
                        (new Date(holding.expiryDate).getTime() - Date.now()) /
                          (24 * 60 * 60 * 1000)
                      )}{" "}
                      days
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div
                      className={cn("font-semibold", getPnlColor(holding.pnl))}
                    >
                      {holding.pnl >= 0 ? "+" : ""}${holding.pnl.toFixed(2)}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        getPnlColor(holding.pnlPercentage)
                      )}
                    >
                      {holding.pnlPercentage >= 0 ? "+" : ""}
                      {holding.pnlPercentage.toFixed(2)}%
                    </div>
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
