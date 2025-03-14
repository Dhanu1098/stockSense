
import React from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WatchlistStockProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistCardProps {
  stocks: WatchlistStockProps[];
  onRemove: (symbol: string) => void;
  onSelect: (symbol: string) => void;
  className?: string;
}

const WatchlistCard: React.FC<WatchlistCardProps> = ({
  stocks,
  onRemove,
  onSelect,
  className = "",
}) => {
  if (stocks.length === 0) {
    return (
      <div className={`glass rounded-xl p-6 border border-border/30 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="size-5 text-muted-foreground" />
          <h2 className="font-medium">Watchlist</h2>
        </div>
        
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">Your watchlist is empty</p>
          <p className="text-sm text-muted-foreground">
            Add stocks to your watchlist to track them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass rounded-xl p-4 border border-border/30 overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Star className="size-5 text-muted-foreground" />
        <h2 className="font-medium">Watchlist</h2>
      </div>
      
      <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-1">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="flex justify-between items-center border-b border-border/20 pb-3 last:border-0"
            onClick={() => onSelect(stock.symbol)}
          >
            <div className="cursor-pointer">
              <h3 className="font-medium">{stock.symbol}</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[100px]">{stock.name}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="font-medium">${stock.price.toFixed(2)}</span>
                <span 
                  className={`text-xs ${stock.change >= 0 ? "trend-up" : "trend-down"}`}
                >
                  {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(stock.symbol);
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistCard;
