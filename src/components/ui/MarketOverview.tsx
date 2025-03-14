import React from "react";
import { ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/apiUtils";

interface MarketIndexProps {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  currency?: string;
  isMock?: boolean;
}

interface MarketOverviewProps {
  indices: MarketIndexProps[];
  className?: string;
  clickable?: boolean;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ 
  indices, 
  className = "",
  clickable = false
}) => {
  const navigate = useNavigate();
  
  const handleIndexClick = (indexName: string) => {
    if (!clickable) return;
    
    // Map index names to corresponding ETF symbols
    const indexToSymbol: Record<string, string> = {
      "S&P 500": "SPY",
      "Dow Jones": "DIA",
      "Nasdaq": "QQQ",
      "NIFTY 50": "NSE:NIFTY50",
      "Bank NIFTY": "NSE:BANKNIFTY",
      "NIFTY IT": "NSE:NIFTYIT"
    };
    
    const symbol = indexToSymbol[indexName];
    if (symbol) {
      navigate(`/stock-analysis?symbol=${symbol}`);
    }
  };
  
  // Helper to determine if an index is Indian
  const isIndianIndex = (name: string): boolean => {
    return name.includes("NIFTY");
  };
  
  return (
    <div className={`glass rounded-xl p-4 border border-border/30 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="size-5 text-muted-foreground" />
        <h2 className="font-medium">Market Indices</h2>
      </div>
      
      <div className="grid gap-3">
        {indices.map((index) => (
          <div 
            key={index.name} 
            className={`flex justify-between items-center border-b border-border/20 pb-3 last:border-0 ${
              clickable ? "cursor-pointer hover:bg-secondary/20 p-2 rounded transition-colors" : ""
            }`}
            onClick={() => handleIndexClick(index.name)}
          >
            <div>
              <h3 className="font-medium">{index.name}</h3>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="font-medium">
                {formatCurrency(index.value, isIndianIndex(index.name) ? "NSE:NIFTY50" : "")}
              </span>
              <div className={`flex items-center gap-1 text-sm ${index.change >= 0 ? "trend-up" : "trend-down"}`}>
                {index.change >= 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                <span>{formatCurrency(Math.abs(index.change), isIndianIndex(index.name) ? "NSE:NIFTY50" : "")}</span>
                <span>({Math.abs(index.changePercent).toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketOverview;
