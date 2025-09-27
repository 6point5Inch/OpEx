"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SelectedOption, OptionSide } from "@/types/options";
import { Chart } from "react-google-charts";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: SelectedOption | null;
}

// Chart data for candlestick chart
const chartData = [
  ["Day", "", "", "", ""],
  ["Mon", 20, 28, 38, 45],
  ["Tue", 31, 38, 55, 66],
  ["Wed", 50, 55, 77, 80],
  ["Thu", 77, 77, 66, 50],
  ["Fri", 68, 66, 22, 15],
];

const chartOptions = {
  legend: "none",
  bar: { groupWidth: "100%" }, // Remove space between bars.
  candlestick: {
    fallingColor: { strokeWidth: 0, fill: "#a52714" }, // red
    risingColor: { strokeWidth: 0, fill: "#0f9d58" }, // green
  },
  backgroundColor: "transparent",
  hAxis: {
    textStyle: { color: "#666" },
    gridlines: { color: "#333" },
  },
  vAxis: {
    textStyle: { color: "#666" },
    gridlines: { color: "#333" },
  },
};

// Hardcoded order book data
const orderBookData = [
  { price: 387.4, size: 80.0, ivPercent: 6.8, side: "ask" },
  { price: 307.4, size: 75.0, ivPercent: 27.6, side: "ask" },
  { price: 232.4, size: 75.0, ivPercent: 28.9, side: "ask" },
  { price: 157.4, size: 75.0, ivPercent: 29.8, side: "ask" },
  { price: 82.4, size: 69.9, ivPercent: 30.2, side: "ask" },
  { price: 12.5, size: 12.5, ivPercent: 30.6, side: "bid" },
  { price: 82.4, size: 69.9, ivPercent: 30.2, side: "bid" },
  { price: 157.4, size: 75.0, ivPercent: 29.8, side: "bid" },
  { price: 232.4, size: 75.0, ivPercent: 28.9, side: "bid" },
  { price: 307.4, size: 75.0, ivPercent: 27.6, side: "bid" },
];

// Trading content component using Aceternity's modal system
const TradeModalContent = ({
  selectedOption,
  onClose,
}: {
  selectedOption: SelectedOption;
  onClose: () => void;
}) => {
  const [side, setSide] = useState<OptionSide>("buy");
  const [contracts, setContracts] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<string>("orderbook");

  const handleSubmit = () => {
    // Here you would implement the actual trading logic
    console.log("Trade submitted:", {
      strikePrice: selectedOption.strikePrice,
      optionType: selectedOption.type,
      side,
      contracts: parseFloat(contracts),
    });

    // Reset form and close modal
    setContracts("1");
    setSide("buy");
    onClose();
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const calculateTotalCost = (): number => {
    const price =
      side === "buy" ? selectedOption.data.ask : selectedOption.data.bid;
    return price * parseFloat(contracts || "0");
  };

  // Order Book Component
  const OrderBookTab = () => (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-400 mb-2 px-2">
        <div>Total</div>
        <div>Size</div>
        <div>IV %</div>
        <div>Price</div>
      </div>
      <div className="space-y-1">
        {orderBookData.map((order, index) => (
          <div
            key={index}
            className={`grid grid-cols-4 gap-4 text-sm px-2 py-1 rounded ${
              order.side === "ask"
                ? "bg-red-900/20 text-red-300"
                : "bg-green-900/20 text-green-300"
            }`}
          >
            <div>{formatNumber(order.size)}</div>
            <div>{formatNumber(order.size)}</div>
            <div>{formatNumber(order.ivPercent, 1)}</div>
            <div className="font-medium">{formatNumber(order.price, 1)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Chart Component
  const ChartTab = () => (
    <div className="h-full bg-gray-900 rounded p-2">
      <Chart
        chartType="CandlestickChart"
        width="100%"
        height="100%"
        data={chartData}
        options={chartOptions}
      />
    </div>
  );

  return (
    <div className="flex h-[80vh] bg-black text-white">
      {/* Left Panel - Trading Interface */}
      <div className="w-1/3 border-r border-gray-700 p-6 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={
                selectedOption.type === "call" ? "default" : "destructive"
              }
              className="bg-blue-600 text-white"
            >
              {selectedOption.type.toUpperCase()}
            </Badge>
            <span className="text-lg font-semibold">
              ${formatNumber(selectedOption.strikePrice, 0)}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            ETH_USDC-27SEP25 • Expiry: 27 Sept 2025
          </div>
        </div>

        {/* Contract Details */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3 text-gray-300">
              Contract Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Mark Price:</span>
                <span className="text-white">
                  ${formatNumber(selectedOption.data.mark)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bid:</span>
                <span className="text-green-400">
                  ${formatNumber(selectedOption.data.bid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ask:</span>
                <span className="text-red-400">
                  ${formatNumber(selectedOption.data.ask)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delta:</span>
                <span className="text-white">
                  {formatNumber(selectedOption.data.delta)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">IV Bid:</span>
                <span className="text-white">
                  {formatPercentage(selectedOption.data.ivBid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">IV Ask:</span>
                <span className="text-white">
                  {formatPercentage(selectedOption.data.ivAsk)}
                </span>
              </div>
              {selectedOption.data.volume && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume:</span>
                  <span className="text-white">
                    {selectedOption.data.volume}
                  </span>
                </div>
              )}
              {selectedOption.data.openInterest && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Open Interest:</span>
                  <span className="text-white">
                    {selectedOption.data.openInterest}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trading Form */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* Contracts Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Contracts
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                placeholder="1"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            {/* Buy/Sell Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                onClick={() => {
                  setSide("buy");
                  handleSubmit();
                }}
                className="bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                disabled={!contracts}
              >
                Buy ${formatNumber(selectedOption.data.ask)}
              </Button>
              <Button
                onClick={() => {
                  setSide("sell");
                  handleSubmit();
                }}
                className="bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
                disabled={!contracts}
              >
                Sell ${formatNumber(selectedOption.data.bid)}
              </Button>
            </div>

            {/* Order Summary */}
            <Card className="bg-gray-900 border-gray-700 mt-4">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contracts:</span>
                    <span className="text-white">{contracts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. Total:</span>
                    <span className="text-white font-medium">
                      ${formatNumber(calculateTotalCost())}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Right Panel - Tabs */}
      <div className="w-2/3 flex flex-col p-4">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-4">
            <TabsTrigger
              value="orderbook"
              className="text-white data-[state=active]:bg-gray-700"
            >
              Order Book
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="text-white data-[state=active]:bg-gray-700"
            >
              Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orderbook" className="flex-1 mt-0">
            <OrderBookTab />
          </TabsContent>

          <TabsContent value="chart" className="flex-1 mt-0">
            <ChartTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Custom modal component that works with the parent component's state
const TradeModalWrapper = ({
  isOpen,
  onClose,
  selectedOption,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: SelectedOption;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[95vw] h-[85vh] bg-black text-white rounded-lg border border-gray-800 overflow-hidden shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </button>

        <TradeModalContent selectedOption={selectedOption} onClose={onClose} />
      </div>
    </div>
  );
};

export function TradeModal({
  isOpen,
  onClose,
  selectedOption,
}: TradeModalProps) {
  if (!selectedOption) return null;

  return (
    <TradeModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      selectedOption={selectedOption}
    />
  );
}
