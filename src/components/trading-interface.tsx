"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ChevronDown, Info, RotateCcw } from "lucide-react";

// Token configurations
const tokens = {
  SOL: {
    symbol: "SOL",
    name: "Solana",
    icon: "◎",
    price: 195.56,
    change: "-3.29%",
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    icon: "$",
    price: 0.99968,
    change: "0%",
  },
  pyUSD: {
    symbol: "pyUSD",
    name: "PayPal USD",
    icon: "P",
    price: 1.0001,
    change: "0.00%",
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    icon: "Ξ",
    price: 2645.32,
    change: "-2.1%",
  },
};

interface TokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  label: string;
  amount: string;
  onAmountChange: (amount: string) => void;
  balance?: string;
}

function TokenSelector({
  selectedToken,
  onTokenSelect,
  label,
  amount,
  onAmountChange,
  balance,
}: TokenSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-400">{label}</span>
        {balance && <span className="text-xs text-stone-500">{balance}</span>}
      </div>
      <div className="flex items-center space-x-3 rounded-lg bg-stone-800/50 p-4 border border-stone-700">
        <Select value={selectedToken} onValueChange={onTokenSelect}>
          <SelectTrigger className="w-32 border-0 bg-stone-700 text-white">
            <SelectValue>
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {tokens[selectedToken as keyof typeof tokens]?.icon}
                </span>
                <span>{selectedToken}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {Object.entries(tokens).map(([symbol, token]) => (
              <SelectItem
                key={symbol}
                value={symbol}
                className="text-white hover:bg-stone-700"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{token.icon}</span>
                  <span>{symbol}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1 text-right">
          <Input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="border-0 bg-transparent text-right text-2xl font-medium text-white placeholder:text-stone-500 focus-visible:ring-0"
          />
          {/* <div className="text-xs text-stone-500 mt-1">
            $
            {(
              parseFloat(amount || "0") *
                tokens[selectedToken as keyof typeof tokens]?.price || 0
            ).toFixed(2)}
          </div> */}
        </div>
      </div>

      {/* <div className="flex justify-end space-x-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-stone-400 hover:text-white hover:bg-stone-800"
          onClick={() =>
            onAmountChange(
              (parseFloat(balance?.split(" ")[0] || "0") * 0.5).toString()
            )
          }
        >
          HALF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-stone-400 hover:text-white hover:bg-stone-800"
          onClick={() => onAmountChange(balance?.split(" ")[0] || "0")}
        >
          MAX
        </Button>
      </div> */}
    </div>
  );
}

function MarketOrderForm() {
  const [sellingToken, setSellingToken] = useState("SOL");
  const [buyingToken, setBuyingToken] = useState("USDC");
  const [sellingAmount, setSellingAmount] = useState("0.629200147");
  const [buyingAmount, setBuyingAmount] = useState("122.860788");

  const handleSwap = () => {
    // Swap tokens
    const tempToken = sellingToken;
    setSellingToken(buyingToken);
    setBuyingToken(tempToken);

    // Swap amounts
    const tempAmount = sellingAmount;
    setSellingAmount(buyingAmount);
    setBuyingAmount(tempAmount);
  };

  const rate = tokens[sellingToken as keyof typeof tokens]?.price || 0;
  const currentRate = `1 ${sellingToken} = ${rate.toFixed(2)} ${buyingToken}`;

  return (
    <div className="space-y-6">
      {/* Ultra V2 Badge */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-lime-600 text-black font-medium"
        >
          Ultra V2
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-400 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Selling Token */}
      <TokenSelector
        selectedToken={sellingToken}
        onTokenSelect={setSellingToken}
        label="Selling"
        amount={sellingAmount}
        onAmountChange={setSellingAmount}
        balance={`0.00 ${sellingToken}`}
      />

      {/* Swap Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600"
          onClick={handleSwap}
        >
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
        </Button>
      </div>

      {/* Buying Token */}
      <TokenSelector
        selectedToken={buyingToken}
        onTokenSelect={setBuyingToken}
        label="Buying"
        amount={buyingAmount}
        onAmountChange={setBuyingAmount}
        balance={`0.00 ${buyingToken}`}
      />

      {/* Submit Button */}
      <Button className="w-full h-12 bg-lime-600 hover:bg-lime-500 text-black font-medium">
        Insufficient SOL
      </Button>

      {/* Rate Info */}
      <div className="flex items-center justify-between text-sm bg-stone-800/30 rounded-lg p-3 border border-stone-700">
        <span className="text-stone-400">{currentRate}</span>
        <div className="flex items-center space-x-2">
          <span className="text-stone-400">0.02% FEE</span>
          <ChevronDown className="h-3 w-3 text-stone-500" />
        </div>
      </div>
    </div>
  );
}

function TriggerOrderForm() {
  const [sellingToken, setSellingToken] = useState("USDC");
  const [buyingToken, setBuyingToken] = useState("ETH");
  const [sellingAmount, setSellingAmount] = useState("5");
  const [buyingAmount, setBuyingAmount] = useState("0.02547617");
  const [buyRate, setBuyRate] = useState("196.261839986");
  const [expiry, setExpiry] = useState("Never");

  const handleSwap = () => {
    // Swap tokens
    const tempToken = sellingToken;
    setSellingToken(buyingToken);
    setBuyingToken(tempToken);

    // Swap amounts
    const tempAmount = sellingAmount;
    setSellingAmount(buyingAmount);
    setBuyingAmount(tempAmount);
  };

  return (
    <div className="space-y-6">
      {/* Selling Token */}
      <TokenSelector
        selectedToken={sellingToken}
        onTokenSelect={setSellingToken}
        label="Selling"
        amount={sellingAmount}
        onAmountChange={setSellingAmount}
        balance={`0.00 ${sellingToken}`}
      />

      {/* Swap Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600"
          onClick={handleSwap}
        >
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
        </Button>
      </div>

      {/* Buying Token */}
      <TokenSelector
        selectedToken={buyingToken}
        onTokenSelect={setBuyingToken}
        label="Buying"
        amount={buyingAmount}
        onAmountChange={setBuyingAmount}
        balance={`0.00 ${buyingToken}`}
      />

      {/* Buy Rate and Expiry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-sm text-stone-400">
            Buy {buyingToken} at rate
          </span>
          <div className="rounded-lg bg-stone-800/50 p-4 border border-stone-700">
            <Input
              value={buyRate}
              onChange={(e) => setBuyRate(e.target.value)}
              className="border-0 bg-transparent text-white text-lg font-medium focus-visible:ring-0"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-stone-500">Use Market</span>
              <span className="text-xs text-stone-400">USDC</span>
            </div>
            <div className="text-xs text-stone-500">≈ ${buyRate}</div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-stone-400">Expiry</span>
          <div className="rounded-lg bg-stone-800/50 p-4 border border-stone-700">
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger className="border-0 bg-transparent text-white text-lg font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem
                  value="Never"
                  className="text-white hover:bg-stone-700"
                >
                  Never
                </SelectItem>
                <SelectItem
                  value="1hour"
                  className="text-white hover:bg-stone-700"
                >
                  1 Hour
                </SelectItem>
                <SelectItem
                  value="1day"
                  className="text-white hover:bg-stone-700"
                >
                  1 Day
                </SelectItem>
                <SelectItem
                  value="1week"
                  className="text-white hover:bg-stone-700"
                >
                  1 Week
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button className="w-full h-12 bg-stone-600 hover:bg-stone-500 text-white font-medium">
        Insufficient USDC
      </Button>

      {/* Ultra Mode Info */}
      <div className="text-xs text-stone-500">
        Ultra Mode: You will receive at least {buyingAmount} {buyingToken},
        minus platform fees.{" "}
        <span className="text-stone-400 underline cursor-pointer">
          Learn more
        </span>
      </div>

      {/* Trigger Summary */}
      <Card className="bg-stone-800/30 border-stone-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-400">Trigger Summary</span>
            <ChevronDown className="h-4 w-4 text-stone-400" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-400">Sell Order</span>
              <span className="text-white">
                {sellingAmount} {sellingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">To Buy</span>
              <span className="text-white">
                {buyingAmount} {buyingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Buy {buyingToken} at Rate</span>
              <span className="text-white">
                {buyRate} {sellingToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Expiry</span>
              <span className="text-white">{expiry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Platform Fee</span>
              <span className="text-lime-400">0.10%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecurringOrderForm() {
  const [allocateToken, setAllocateToken] = useState("USDC");
  const [buyToken, setBuyToken] = useState("ETH");
  const [allocateAmount, setAllocateAmount] = useState("120");
  const [frequency, setFrequency] = useState("1");
  const [period, setPeriod] = useState("minute");
  const [orderCount, setOrderCount] = useState("2");

  const handleSwap = () => {
    // Swap tokens
    const tempToken = allocateToken;
    setAllocateToken(buyToken);
    setBuyToken(tempToken);

    // Note: For recurring orders, we don't swap amounts as it's allocation-based
  };

  return (
    <div className="space-y-6">
      {/* I Want To Allocate */}
      <TokenSelector
        selectedToken={allocateToken}
        onTokenSelect={setAllocateToken}
        label="I Want To Allocate"
        amount={allocateAmount}
        onAmountChange={setAllocateAmount}
        balance={`0.00 ${allocateToken}`}
      />

      {/* Swap Arrow */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-600"
          onClick={handleSwap}
        >
          <ArrowUpDown className="h-4 w-4 text-stone-400" />
        </Button>
      </div>

      {/* To Buy */}
      <TokenSelector
        selectedToken={buyToken}
        onTokenSelect={setBuyToken}
        label="To Buy"
        amount="0.00"
        onAmountChange={() => {}}
        balance={`0.00 ${buyToken}`}
      />

      {/* Frequency Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-sm text-stone-400">Every</span>
          <div className="flex items-center space-x-2">
            <Input
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="bg-stone-800/50 border-stone-700 text-white h-12 text-center"
            />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-stone-800 border-stone-700">
                <SelectItem
                  value="minute"
                  className="text-white hover:bg-stone-700"
                >
                  minute
                </SelectItem>
                <SelectItem
                  value="hour"
                  className="text-white hover:bg-stone-700"
                >
                  hour
                </SelectItem>
                <SelectItem
                  value="day"
                  className="text-white hover:bg-stone-700"
                >
                  day
                </SelectItem>
                <SelectItem
                  value="week"
                  className="text-white hover:bg-stone-700"
                >
                  week
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-stone-400">Over</span>
            <Info className="h-3 w-3 text-stone-500" />
          </div>
          <div className="flex items-center space-x-2">
            <Input
              value={orderCount}
              onChange={(e) => setOrderCount(e.target.value)}
              className="bg-stone-800/50 border-stone-700 text-white h-12 text-center"
            />
            <span className="text-stone-400 text-sm whitespace-nowrap">
              orders
            </span>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-stone-400">
              Price Range (optional)
            </span>
            <Info className="h-3 w-3 text-stone-500" />
          </div>
          <span className="text-xs text-stone-500">Rate: 196.3 USDC / ETH</span>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Min Price"
            className="bg-stone-800/50 border-stone-700 text-white placeholder:text-stone-500"
          />
          <span className="text-stone-500">-</span>
          <Input
            placeholder="Max Price"
            className="bg-stone-800/50 border-stone-700 text-white placeholder:text-stone-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button className="w-full h-12 bg-stone-600 hover:bg-stone-500 text-white font-medium">
        Insufficient balance
      </Button>

      {/* Recurring Summary */}
      <Card className="bg-stone-800/30 border-stone-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-400">Recurring Summary</span>
            <ChevronDown className="h-4 w-4 text-stone-400" />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-400">Sell total</span>
              <span className="text-white">
                {allocateAmount} {allocateToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Sell per order</span>
              <span className="text-white">
                {(parseFloat(allocateAmount) / parseFloat(orderCount)).toFixed(
                  0
                )}{" "}
                {allocateToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">To buy</span>
              <span className="text-white">{buyToken}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Order interval</span>
              <span className="text-white">
                {frequency} {period}(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Estimated end date</span>
              <span className="text-white">26 Sep 2025 18:27</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">Platform fee</span>
              <span className="text-lime-400">0.1%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TradingInterface() {
  const [activeTab, setActiveTab] = useState("market");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-950 p-4">
        <div className="mx-auto max-w-md">
          <div className="animate-pulse">
            <div className="h-12 bg-stone-800 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 bg-stone-800 rounded-lg"></div>
              <div className="h-20 bg-stone-800 rounded-lg"></div>
              <div className="h-12 bg-stone-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4">
      <div className="mx-auto max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-stone-900 border border-stone-800">
            <TabsTrigger
              value="market"
              className="text-stone-400 data-[state=active]:bg-lime-600 data-[state=active]:text-black font-medium"
            >
              Market
            </TabsTrigger>
            <TabsTrigger
              value="trigger"
              className="text-stone-400 data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              Trigger
            </TabsTrigger>
            <TabsTrigger
              value="recurring"
              className="text-stone-400 data-[state=active]:bg-stone-800 data-[state=active]:text-white"
            >
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="mt-0">
            <MarketOrderForm />
          </TabsContent>

          <TabsContent value="trigger" className="mt-0">
            <TriggerOrderForm />
          </TabsContent>

          <TabsContent value="recurring" className="mt-0">
            <RecurringOrderForm />
          </TabsContent>
        </Tabs>

        {/* Token Prices Footer */}
        <div className="mt-8 space-y-3">
          {Object.entries(tokens).map(([symbol, token]) => (
            <div
              key={symbol}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{token.icon}</span>
                <div>
                  <div className="text-white font-medium">{symbol}</div>
                  <div className="text-xs text-stone-500">{token.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white">${token.price}</div>
                <div
                  className={`text-xs ${
                    token.change.startsWith("-")
                      ? "text-red-400"
                      : "text-lime-400"
                  }`}
                >
                  {token.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Open Swap Page */}
        <Button
          variant="ghost"
          className="w-full mt-6 text-stone-400 hover:text-white hover:bg-stone-800 justify-between"
        >
          <span>Open Swap page</span>
          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
        </Button>
      </div>
    </div>
  );
}
