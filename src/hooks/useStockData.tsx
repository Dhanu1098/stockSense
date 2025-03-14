import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  fetchStockQuote, 
  fetchCompanyOverview, 
  fetchTimeSeriesData, 
  fetchMarketIndices as fetchMarketIndicesAPI,
  fetchTrendingStocks as fetchTrendingStocksAPI
} from "@/utils/apiUtils";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: Array<{ date: string; value: number }>;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividend: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  week52High: number;
  week52Low: number;
  currency: string;
}

// Custom hook for fetching stock data
const useStockData = (initialSymbol?: string) => {
  const [symbol, setSymbol] = useState<string | undefined>(initialSymbol);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch stock quote
        const quote = await fetchStockQuote(symbol);
        
        // Fetch company overview
        const overview = await fetchCompanyOverview(symbol);
        
        // Fetch chart data
        const chartData = await fetchTimeSeriesData(symbol);
        
        // Calculate missing values for mock data
        const high = quote.price * 1.02;
        const low = quote.price * 0.98;
        const open = quote.price - (quote.change * 0.5);
        const previousClose = quote.price - quote.change;
        const avgVolume = quote.volume * 0.9;
        const week52High = quote.price * 1.3;
        const week52Low = quote.price * 0.7;
        
        setStockData({
          symbol: quote.symbol,
          name: overview.name || quote.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          chartData,
          marketCap: parseFloat(overview.marketCap?.replace(/[^0-9.]/g, '') || '0'),
          peRatio: overview.peRatio || 0,
          eps: overview.eps || 0,
          dividend: overview.dividend || 0,
          volume: quote.volume,
          avgVolume: avgVolume,
          high,
          low,
          open,
          previousClose,
          week52High,
          week52Low,
          currency: symbol.startsWith('NSE:') ? 'INR' : 'USD'
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch stock data";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [symbol]);
  
  return {
    stockData,
    isLoading,
    error,
    setSymbol,
  };
};

// Market indices fetching function
const fetchMarketIndices = fetchMarketIndicesAPI;

// Trending stocks fetching function
const fetchTrendingStocks = fetchTrendingStocksAPI;

// Mock watchlist storage
const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("watchlist");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);
  
  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist([...watchlist, symbol]);
      toast.success(`Added ${symbol} to watchlist`);
    }
  };
  
  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(s => s !== symbol));
    toast.success(`Removed ${symbol} from watchlist`);
  };
  
  const isInWatchlist = (symbol: string) => {
    return watchlist.includes(symbol);
  };
  
  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  };
};

// Export all hooks and functions
export { useStockData, fetchMarketIndices, fetchTrendingStocks, useWatchlist };
