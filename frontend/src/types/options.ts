export interface OptionsData {
  strikePrice: number;
  calls: {
    delta: number;
    size: number;
    ivBid: number;
    bid: number;
    mark: number;
    ask: number;
    ivAsk: number;
    size2: number;
    position: number;
    volume?: number;
    openInterest?: number;
    instrumentName?: string;
  };
  puts: {
    delta: number;
    size: number;
    ivBid: number;
    bid: number;
    mark: number;
    ask: number;
    ivAsk: number;
    size2: number;
    position: number;
    volume?: number;
    openInterest?: number;
    instrumentName?: string;
  };
}

export interface SelectedOption {
  strikePrice: number;
  type: "call" | "put";
  side: "buy" | "sell";
  data: OptionsData["calls"] | OptionsData["puts"];
  instrumentName?: string;
}

export type OptionType = "call" | "put";
export type OptionSide = "buy" | "sell";
