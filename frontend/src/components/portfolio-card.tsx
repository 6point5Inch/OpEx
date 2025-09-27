"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp } from "lucide-react";

interface PortfolioCardProps {
  totalValue: number;
  totalPnl: number;
}

export function PortfolioCard({ totalValue, totalPnl }: PortfolioCardProps) {
  const pnlPercentage = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;
  const isPositive = totalPnl >= 0;

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Net Worth</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-white">
            ${totalValue.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">0.00 SOL</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">
                Holdings PnL
              </span>
            </div>
            <div className="text-sm font-semibold text-white">
              ${Math.abs(totalPnl).toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">NEW</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-muted-foreground">
                Options Held
              </span>
            </div>
            <div className="text-sm font-semibold text-white">5</div>
            <div className="text-xs text-muted-foreground">positions</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Yearly APR %</div>
          <div className="flex items-center justify-between">
            <span
              className={`text-lg font-bold ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {pnlPercentage.toFixed(2)}%
            </span>
            <Badge variant="secondary" className="text-xs">
              {isPositive ? "+" : ""}
              {pnlPercentage.toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>View all</span>
            <span>0 platforms</span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            {isPositive ? "No yield detected." : "Portfolio at loss"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
