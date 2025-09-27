export interface Holding {
  id: string;
  instrumentName: string;
  quantity: number;
  expiryDate: string;
  strikePrice: number;
  type: "call" | "put";
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
}

export interface PortfolioSummary {
  netWorth: number;
  totalHoldings: number;
  totalPnl: number;
  totalPnlPercentage: number;
  jupHoldings: number;
  jupStaked: number;
  yearlyApr: number;
}
