"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, Wifi, WifiOff } from "lucide-react";

import { OptionChart } from "@/components/option-chart";
import { Holding } from "@/types/holdings";
import { PortfolioCard } from "@/components/portfolio-card";
import { HoldingsTable } from "@/components/holdings-table";

// Dummy data for holdings
const dummyHoldings: Holding[] = [
  {
    id: "1",
    instrumentName: "1INCH-0.211-30d-call",
    quantity: 5,
    expiryDate: "2024-12-29",
    strikePrice: 3500,
    type: "call",
    averagePrice: 250.5,
    currentPrice: 275.2,
    pnl: 123.5,
    pnlPercentage: 9.85,
  },
  {
    id: "2",
    instrumentName: "1INCH-0.224-7d-put",
    quantity: 3,
    expiryDate: "2024-12-29",
    strikePrice: 3200,
    type: "put",
    averagePrice: 180.0,
    currentPrice: 165.8,
    pnl: -42.6,
    pnlPercentage: -7.89,
  },
  {
    id: "3",
    instrumentName: "ETH-3760-7d-call",
    quantity: 10,
    expiryDate: "2025-01-15",
    strikePrice: 0.5,
    type: "call",
    averagePrice: 0.035,
    currentPrice: 0.042,
    pnl: 0.07,
    pnlPercentage: 20.0,
  },
  {
    id: "4",
    instrumentName: "ETH-3950-7d-call",
    quantity: 2,
    expiryDate: "2025-01-05",
    strikePrice: 3800,
    type: "call",
    averagePrice: 120.5,
    currentPrice: 98.3,
    pnl: -44.4,
    pnlPercentage: -18.42,
  },
  {
    id: "5",
    instrumentName: "ETH-3930-7d-call",
    quantity: 8,
    expiryDate: "2025-01-22",
    strikePrice: 0.4,
    type: "put",
    averagePrice: 0.018,
    currentPrice: 0.022,
    pnl: 0.032,
    pnlPercentage: 22.22,
  },
];

export default function Holdings() {
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

  const handleHoldingSelect = (holding: Holding) => {
    setSelectedHolding(holding);
  };

  const totalPnl = dummyHoldings.reduce((sum, holding) => sum + holding.pnl, 0);
  const totalValue = dummyHoldings.reduce(
    (sum, holding) => sum + holding.currentPrice * holding.quantity,
    0
  );

  return (
    <div className="px-4 py-2 space-y-4 h-screen flex flex-col">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Holdings</h1>
            <p className="text-muted-foreground">
              View and manage your option positions.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Portfolio Overview Card */}
          <PortfolioCard totalValue={totalValue} totalPnl={totalPnl} />

          {/* Chart */}
          <div className="flex-1">
            <OptionChart
              instrumentName={selectedHolding?.instrumentName || null}
            />
          </div>
        </div>

        {/* Right Column - Holdings Table */}
        <div className="flex flex-col">
          <HoldingsTable
            holdings={dummyHoldings}
            selectedHolding={selectedHolding}
            onHoldingSelect={handleHoldingSelect}
          />
        </div>
      </main>
    </div>
  );
}
