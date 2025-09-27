"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectedOption, OptionSide } from "@/types/options";
import { getWebSocketManager, OptionUpdate } from "@/utils/websocket";
import { Wifi, WifiOff } from "lucide-react";

interface TradePanelProps {
  selectedOption: SelectedOption | null;
}

export function TradePanel({ selectedOption }: TradePanelProps) {
  const [side, setSide] = useState<OptionSide>("buy");
  const [contracts, setContracts] = useState<string>("1");
  const [realtimeOptionData, setRealtimeOptionData] =
    useState<SelectedOption | null>(selectedOption);
  const [isOptionConnected, setIsOptionConnected] = useState<boolean>(false);

  useEffect(() => {
    setRealtimeOptionData(selectedOption);
    if (!selectedOption?.instrumentName) return;

    const wsManager = getWebSocketManager();

    const handleOptionUpdate = (update: OptionUpdate) => {
      if (update.data.instrument_name === selectedOption.instrumentName) {
        setRealtimeOptionData((prev) => {
          if (!prev) return null;
          const newHestonPrice = update.data.heston_price;
          const newData = {
            ...prev.data,
            bid: newHestonPrice || -69,
            mark: newHestonPrice || -69,
            ask: newHestonPrice ? newHestonPrice * 1.02 : -69,
          };
          return { ...prev, data: newData };
        });
      }
    };

    const handleConnect = () => setIsOptionConnected(true);
    const handleDisconnect = () => setIsOptionConnected(false);

    wsManager.setEventHandlers({
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onUpdate: handleOptionUpdate,
    });

    wsManager.subscribe(selectedOption.instrumentName);
    setIsOptionConnected(wsManager.isConnected());

    return () => {
      if (selectedOption.instrumentName) {
        wsManager.unsubscribe(selectedOption.instrumentName);
      }
    };
  }, [selectedOption]);

  const handleSubmit = () => {
    if (!realtimeOptionData) return;
    console.log("Trade submitted:", {
      strikePrice: realtimeOptionData.strikePrice,
      optionType: realtimeOptionData.type,
      side,
      contracts: parseFloat(contracts),
      instrumentName: realtimeOptionData.instrumentName,
      prices: realtimeOptionData.data,
    });
    setContracts("1");
    setSide("buy");
  };

  const formatNumber = (
    value: number | undefined,
    decimals: number = 2
  ): string => {
    if (value === undefined || value === -69) return "-";
    return value.toFixed(decimals);
  };

  const calculateTotalCost = (): number => {
    if (!realtimeOptionData) return 0;
    const { ask, bid } = realtimeOptionData.data;
    if (ask === -69 || bid === -69) return 0;
    const price = side === "buy" ? ask : bid;
    return price * parseFloat(contracts || "0");
  };

  if (!selectedOption || !realtimeOptionData) {
    return (
      <Card className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p>Select an option to start trading.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
        <CardTitle className="text-sm font-medium">Trade</CardTitle>
        <div className="flex items-center space-x-1">
          {isOptionConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs ${
              isOptionConnected ? "text-green-400" : "text-red-400"
            }`}
          >
            {isOptionConnected ? "Live" : "Offline"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant={
                selectedOption.type === "call" ? "default" : "destructive"
              }
            >
              {selectedOption.type.toUpperCase()}
            </Badge>
            <span className="text-lg font-semibold">
              ${formatNumber(realtimeOptionData.strikePrice, 6)}
            </span>
          </div>

          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mark:</span>
              <span className="font-semibold">
                ${formatNumber(realtimeOptionData.data.mark, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bid:</span>
              <span className="text-green-500 font-semibold">
                ${formatNumber(realtimeOptionData.data.bid, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ask:</span>
              <span className="text-red-500 font-semibold">
                ${formatNumber(realtimeOptionData.data.ask, 4)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">
              Contracts
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={contracts}
              onChange={(e) => setContracts(e.target.value)}
              placeholder="1"
              className="bg-background"
            />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              onClick={() => {
                setSide("buy");
                handleSubmit();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!contracts || realtimeOptionData.data.ask === -69}
            >
              Buy
            </Button>
            <Button
              onClick={() => {
                setSide("sell");
                handleSubmit();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!contracts || realtimeOptionData.data.bid === -69}
            >
              Sell
            </Button>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-2">
            Est. Total: ${formatNumber(calculateTotalCost(), 4)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
