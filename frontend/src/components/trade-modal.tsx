"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SelectedOption, OptionSide } from "@/types/options";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOption: SelectedOption | null;
}

export function TradeModal({
  isOpen,
  onClose,
  selectedOption,
}: TradeModalProps) {
  const [side, setSide] = useState<OptionSide>("buy");
  const [quantity, setQuantity] = useState<string>("1");
  const [orderType, setOrderType] = useState<string>("market");
  const [limitPrice, setLimitPrice] = useState<string>("");

  if (!selectedOption) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would implement the actual trading logic
    console.log("Trade submitted:", {
      strikePrice: selectedOption.strikePrice,
      optionType: selectedOption.type,
      side,
      quantity: parseFloat(quantity),
      orderType,
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
    });

    // Reset form and close modal
    setQuantity("1");
    setLimitPrice("");
    setOrderType("market");
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
      orderType === "market"
        ? side === "buy"
          ? selectedOption.data.ask
          : selectedOption.data.bid
        : parseFloat(limitPrice) || 0;
    return price * parseFloat(quantity || "0");
  };

  const getMarketPrice = (): number => {
    return side === "buy" ? selectedOption.data.ask : selectedOption.data.bid;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              variant={
                selectedOption.type === "call" ? "default" : "destructive"
              }
            >
              {selectedOption.type.toUpperCase()}
            </Badge>
            Trade Option - Strike ${formatNumber(selectedOption.strikePrice, 0)}
          </DialogTitle>
          <DialogDescription>
            Configure your {selectedOption.type} option trade for strike price $
            {formatNumber(selectedOption.strikePrice, 0)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Option Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mark Price:</span>
                    <span className="font-medium">
                      ${formatNumber(selectedOption.data.mark)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bid:</span>
                    <span className="font-medium">
                      ${formatNumber(selectedOption.data.bid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ask:</span>
                    <span className="font-medium">
                      ${formatNumber(selectedOption.data.ask)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delta:</span>
                    <span className="font-medium">
                      {formatNumber(selectedOption.data.delta)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IV Bid:</span>
                    <span className="font-medium">
                      {formatPercentage(selectedOption.data.ivBid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IV Ask:</span>
                    <span className="font-medium">
                      {formatPercentage(selectedOption.data.ivAsk)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Trade Configuration */}
          <div className="space-y-4">
            {/* Buy/Sell Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Side</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={side === "buy" ? "default" : "outline"}
                  onClick={() => setSide("buy")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  variant={side === "sell" ? "default" : "outline"}
                  onClick={() => setSide("sell")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sell
                </Button>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
            </div>

            {/* Order Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Type</label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limit Price (if limit order) */}
            {orderType === "limit" && (
              <div className="space-y-2">
                <label htmlFor="limitPrice" className="text-sm font-medium">
                  Limit Price ($)
                </label>
                <Input
                  id="limitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="Enter limit price"
                  required
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Price:</span>
                  <span className="font-medium">
                    ${formatNumber(getMarketPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{quantity} contracts</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Cost:</span>
                  <span
                    className={
                      side === "buy" ? "text-red-600" : "text-green-600"
                    }
                  >
                    {side === "buy" ? "-" : "+"}$
                    {formatNumber(calculateTotalCost())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className={
                side === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
              disabled={!quantity || (orderType === "limit" && !limitPrice)}
            >
              {side === "buy" ? "Buy" : "Sell"}{" "}
              {selectedOption.type.toUpperCase()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
