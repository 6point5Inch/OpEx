"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SelectedOption, OptionSide } from "@/types/options";
import { Chart } from "react-google-charts";
import { useRealTimeChartData } from "@/hooks/useRealTimeChartData";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: SelectedOption | null;
}

const getChartOptions = (isDark: boolean = false) => ({
  legend: "none",
  bar: { groupWidth: "100%" },
  candlestick: {
    fallingColor: { strokeWidth: 0, fill: "#ef4444" }, // red
    risingColor: { strokeWidth: 0, fill: "#22c55e" }, // green
  },
  backgroundColor: "transparent",
  hAxis: {
    textStyle: { color: isDark ? "#9ca3af" : "#666" },
    gridlines: { color: isDark ? "#374151" : "#e5e7eb" },
  },
  vAxis: {
    textStyle: { color: isDark ? "#9ca3af" : "#666" },
    gridlines: { color: isDark ? "#374151" : "#e5e7eb" },
  },
});

// Create placeholder order book data with -69 values where data is not available
const createOrderBookData = (selectedOption: SelectedOption) => [
  { price: selectedOption.data.ask, size: -69, ivPercent: -69, side: "ask" },
  {
    price: selectedOption.data.ask * 0.98,
    size: -69,
    ivPercent: -69,
    side: "ask",
  },
  {
    price: selectedOption.data.ask * 0.96,
    size: -69,
    ivPercent: -69,
    side: "ask",
  },
  {
    price: selectedOption.data.ask * 0.94,
    size: -69,
    ivPercent: -69,
    side: "ask",
  },
  {
    price: selectedOption.data.ask * 0.92,
    size: -69,
    ivPercent: -69,
    side: "ask",
  },
  { price: selectedOption.data.bid, size: -69, ivPercent: -69, side: "bid" },
  {
    price: selectedOption.data.bid * 1.02,
    size: -69,
    ivPercent: -69,
    side: "bid",
  },
  {
    price: selectedOption.data.bid * 1.04,
    size: -69,
    ivPercent: -69,
    side: "bid",
  },
  {
    price: selectedOption.data.bid * 1.06,
    size: -69,
    ivPercent: -69,
    side: "bid",
  },
  {
    price: selectedOption.data.bid * 1.08,
    size: -69,
    ivPercent: -69,
    side: "bid",
  },
];

// Trading content component using Aceternity's modal system
const TradeModalContent = ({
  selectedOption,
  onClose,
  isOpen,
}: {
  selectedOption: SelectedOption;
  onClose: () => void;
  isOpen: boolean;
}) => {
  const [side, setSide] = useState<OptionSide>("buy");
  const [contracts, setContracts] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<string>("orderbook");

  // Real-time chart data hook
  const {
    chartData,
    loading: chartLoading,
    error: chartError,
    isConnected: chartConnected,
    subscribe,
    unsubscribe,
  } = useRealTimeChartData();

  // Subscribe to chart updates when modal opens
  useEffect(() => {
    if (isOpen && selectedOption?.instrumentName) {
      subscribe(selectedOption.instrumentName);
    }

    return () => {
      if (!isOpen) {
        unsubscribe();
      }
    };
  }, [isOpen, selectedOption?.instrumentName, subscribe, unsubscribe]);

  const handleSubmit = () => {
    // Here you would implement the actual trading logic
    console.log("Trade submitted:", {
      strikePrice: selectedOption.strikePrice,
      optionType: selectedOption.type,
      side,
      contracts: parseFloat(contracts),
      instrumentName: selectedOption.instrumentName,
    });

    // Reset form and close modal
    setContracts("1");
    setSide("buy");
    onClose();
  };

  const formatNumber = (
    value: number | undefined,
    decimals: number = 2
  ): string => {
    if (value === undefined || value === -69) return "-";
    return value.toFixed(decimals);
  };

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === -69) return "-";
    return `${(value * 100).toFixed(1)}%`;
  };

  const calculateTotalCost = (): number => {
    if (selectedOption.data.ask === -69 || selectedOption.data.bid === -69)
      return 0;
    const price =
      side === "buy" ? selectedOption.data.ask : selectedOption.data.bid;
    return price * parseFloat(contracts || "0");
  };

  // Create order book data based on selected option
  const orderBookData = createOrderBookData(selectedOption);

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
            key={`${order.side}-${order.price}-${index}`}
            className={`grid grid-cols-4 gap-4 text-sm px-2 py-1 rounded ${
              order.side === "ask"
                ? "bg-red-900/20 text-red-300"
                : "bg-green-900/20 text-green-300"
            }`}
          >
            <div>{formatNumber(order.size)}</div>
            <div>{formatNumber(order.size)}</div>
            <div>{formatNumber(order.ivPercent, 1)}</div>
            <div className="font-medium">{formatNumber(order.price, 4)}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Chart Component
  const ChartTab = () => {
    // Convert chart data to Google Charts format
    const googleChartsData = [
      ["Time", "Low", "Open", "Close", "High"],
      ...chartData.map((point) => [
        point.date.toLocaleTimeString(),
        point.low,
        point.open,
        point.close,
        point.high,
      ]),
    ];

    if (chartLoading) {
      return (
        <div className="h-full bg-gray-900 rounded p-2 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading chart data...</span>
          </div>
        </div>
      );
    }

    if (chartError || chartData.length === 0) {
      return (
        <div className="h-full bg-gray-900 rounded p-2 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm text-center">
              {chartError || "No chart data available"}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gray-900 rounded p-2 relative">
        {/* Connection Status */}
        <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
          {chartConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs ${
              chartConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {chartConnected ? "Live" : "Offline"}
          </span>
        </div>

        <Chart
          chartType="CandlestickChart"
          width="100%"
          height="100%"
          data={googleChartsData}
          options={getChartOptions(true)}
        />
      </div>
    );
  };

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
                  ${formatNumber(selectedOption.data.mark, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bid:</span>
                <span className="text-green-400">
                  ${formatNumber(selectedOption.data.bid, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ask:</span>
                <span className="text-red-400">
                  ${formatNumber(selectedOption.data.ask, 6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delta:</span>
                <span className="text-white">
                  {formatNumber(selectedOption.data.delta, 3)}
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
              <div className="flex justify-between">
                <span className="text-gray-400">Volume:</span>
                <span className="text-white">
                  {formatNumber(selectedOption.data.volume)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Open Interest:</span>
                <span className="text-white">
                  {formatNumber(selectedOption.data.openInterest)}
                </span>
              </div>
              {selectedOption.instrumentName && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Instrument:</span>
                  <span className="text-white font-mono text-xs">
                    {selectedOption.instrumentName}
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
                disabled={!contracts || selectedOption.data.ask === -69}
              >
                Buy ${formatNumber(selectedOption.data.ask, 6)}
              </Button>
              <Button
                onClick={() => {
                  setSide("sell");
                  handleSubmit();
                }}
                className="bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
                disabled={!contracts || selectedOption.data.bid === -69}
              >
                Sell ${formatNumber(selectedOption.data.bid, 6)}
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
                      ${formatNumber(calculateTotalCost(), 6)}
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

        <TradeModalContent
          selectedOption={selectedOption}
          onClose={onClose}
          isOpen={isOpen}
        />
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
