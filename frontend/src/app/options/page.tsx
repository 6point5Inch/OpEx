"use client";

import React, { useState } from "react";
import { OptionsTable } from "@/components/options-table";
import { TradeModal } from "@/components/trade-modal";
import { mockOptionsData, mockMarketData } from "@/utils/mockData";
import { SelectedOption } from "@/types/options";

export default function Options() {
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(
    null
  );
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const handleOptionSelect = (option: SelectedOption) => {
    setSelectedOption(option);
  };

  const handleOptionDoubleClick = (option: SelectedOption) => {
    setSelectedOption(option);
    setIsTradeModalOpen(true);
  };

  const handleCloseTradeModal = () => {
    setIsTradeModalOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Options Trading</h1>
        <p className="text-muted-foreground">
          Select an option to view details or double-click to open the trade
          modal.
        </p>
      </div>

      <OptionsTable
        data={mockOptionsData}
        selectedOption={selectedOption}
        onOptionSelect={handleOptionSelect}
        onOptionDoubleClick={handleOptionDoubleClick}
        underlyingPrice={mockMarketData.underlyingPrice}
        expirationDate={mockMarketData.expirationDate}
        timeToExpiry={mockMarketData.timeToExpiry}
      />

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={handleCloseTradeModal}
        selectedOption={selectedOption}
      />

      {selectedOption && (
        <div className="mt-6 p-4 bg-muted/20 rounded-lg border">
          <h3 className="font-semibold mb-2">Selected Option Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-medium capitalize">
                {selectedOption.type}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Strike:</span>
              <span className="ml-2 font-medium">
                ${selectedOption.strikePrice}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Mark:</span>
              <span className="ml-2 font-medium">
                ${selectedOption.data.mark.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Delta:</span>
              <span className="ml-2 font-medium">
                {selectedOption.data.delta.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
