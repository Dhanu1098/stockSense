import React from "react";
import { ArrowUpRight, ArrowDownRight, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/apiUtils";

interface StockCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  inWatchlist?: boolean;
  onToggleWatchlist?: () => void;
  onClick?: () => void;
  className?: string;
}

const StockCard: React.FC<StockCardProps> = ({
  symbol,
  name,
  price,
  change,
  changePercent,
  inWatchlist = false,
  onToggleWatchlist,
  onClick,
  className = "",
}) => {
  const isPositive = change >= 0;

  return (
    <div 
      className={`stock-card cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="overflow-hidden">
          <h3 className="font-semibold text-lg truncate">{symbol}</h3>
          <p className="text-sm text-muted-foreground truncate">{name}</p>
        </div>
        {onToggleWatchlist && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 -mt-1 -mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist();
            }}
          >
            {inWatchlist ? (
              <Star className="size-[18px] fill-amber-400 text-amber-400" />
            ) : (
              <StarOff className="size-[18px] text-muted-foreground" />
            )}
          </Button>
        )}
      </div>

      <div className="mt-6 flex justify-between items-end">
        <div>
          <div className="text-2xl font-medium">
            {formatCurrency(price, symbol)}
          </div>
          <div className={`flex items-center gap-1 ${isPositive ? "trend-up" : "trend-down"}`}>
            {isPositive ? (
              <ArrowUpRight className="size-4" />
            ) : (
              <ArrowDownRight className="size-4" />
            )}
            <span>{formatCurrency(Math.abs(change), symbol)}</span>
            <span>({Math.abs(changePercent).toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
