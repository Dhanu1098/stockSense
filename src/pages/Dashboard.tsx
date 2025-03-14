import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart2, 
  LineChart, 
  ListChecks, 
  Star, 
  Newspaper, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  X,
  Info
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/useStockData";
import { fetchStockQuote, formatCurrency } from "@/utils/apiUtils";
import WatchlistCard from "@/components/ui/WatchlistCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import CustomChart from "@/components/ui/CustomChart";

const Dashboard = () => {
  const navigate = useNavigate();
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [newSymbol, setNewSymbol] = useState("");
  
  // Mock portfolio data
  const [portfolio, setPortfolio] = useState([
    { symbol: "AAPL", shares: 10, avgPrice: 152.35 },
    { symbol: "MSFT", shares: 5, avgPrice: 287.70 },
    { symbol: "AMZN", shares: 3, avgPrice: 135.95 },
  ]);
  
  // Fetch watchlist data
  useEffect(() => {
    const fetchWatchlistData = async () => {
      if (watchlist.length === 0) {
        setWatchlistData([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const stockPromises = watchlist.map(symbol => fetchStockQuote(symbol));
        const stocksData = await Promise.all(stockPromises);
        setWatchlistData(stocksData);
      } catch (error) {
        console.error("Error fetching watchlist data:", error);
        toast.error("Failed to load watchlist data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWatchlistData();
  }, [watchlist]);
  
  // Calculate portfolio value
  useEffect(() => {
    const calculatePortfolioValue = async () => {
      if (portfolio.length === 0) {
        setPortfolioValue(0);
        return;
      }
      
      try {
        let totalValue = 0;
        const stockPromises = portfolio.map(item => fetchStockQuote(item.symbol));
        const stocksData = await Promise.all(stockPromises);
        
        stocksData.forEach((stock, index) => {
          if (stock) {
            const position = portfolio[index];
            totalValue += stock.price * position.shares;
          }
        });
        
        setPortfolioValue(totalValue);
      } catch (error) {
        console.error("Error calculating portfolio value:", error);
      }
    };
    
    calculatePortfolioValue();
  }, [portfolio]);
  
  // Handle adding new symbol to watchlist
  const handleAddSymbol = () => {
    if (!newSymbol.trim()) {
      toast.error("Please enter a valid symbol");
      return;
    }
    
    const symbol = newSymbol.toUpperCase();
    if (isInWatchlist(symbol)) {
      toast.error(`${symbol} is already in your watchlist`);
      return;
    }
    
    addToWatchlist(symbol);
    setNewSymbol("");
    toast.success(`${symbol} added to watchlist`);
  };
  
  // Generate mock portfolio chart data
  const generatePortfolioChartData = () => {
    const data = [];
    const dataPoints = 30;
    let value = 10000;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - i));
      
      // Add some volatility
      value = value * (1 + (Math.random() * 0.02) - 0.01);
      
      data.push({
        date: date.toLocaleDateString(),
        value: parseFloat(value.toFixed(2)),
      });
    }
    
    return data;
  };
  
  const portfolioChartData = generatePortfolioChartData();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-28 pb-16">
        <div className="container-padding mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Track your portfolio and watchlist in one place</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Portfolio Summary */}
            <div className="lg:col-span-2 glass rounded-xl p-6 border border-border/30">
              <div className="flex items-center gap-2 mb-6">
                <Briefcase className="size-5 text-muted-foreground" />
                <h2 className="text-xl font-medium">Portfolio Summary</h2>
              </div>
              
              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary/40 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Value</div>
                    <div className="text-2xl font-medium">{formatCurrency(portfolioValue, '')}</div>
                  </div>
                  <div className="p-4 bg-secondary/40 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Daily Change</div>
                    <div className="text-2xl font-medium trend-up">+2.3%</div>
                  </div>
                  <div className="p-4 bg-secondary/40 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Gain/Loss</div>
                    <div className="text-2xl font-medium trend-up">+{formatCurrency(1250.75, '')}</div>
                  </div>
                  <div className="p-4 bg-secondary/40 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Positions</div>
                    <div className="text-2xl font-medium">{portfolio.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <CustomChart data={portfolioChartData} />
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Positions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left pb-2">Symbol</th>
                        <th className="text-left pb-2">Shares</th>
                        <th className="text-left pb-2">Avg. Cost</th>
                        <th className="text-left pb-2">Current</th>
                        <th className="text-left pb-2">Value</th>
                        <th className="text-left pb-2">Gain/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((position) => {
                        const stockData = watchlistData.find(stock => stock.symbol === position.symbol);
                        const currentPrice = stockData ? stockData.price : 0;
                        const totalValue = currentPrice * position.shares;
                        const gainLoss = currentPrice - position.avgPrice;
                        const gainLossPercent = (gainLoss / position.avgPrice) * 100;
                        
                        return (
                          <tr key={position.symbol} className="border-b border-border/10 hover:bg-secondary/20">
                            <td className="py-3 font-medium">{position.symbol}</td>
                            <td className="py-3">{position.shares}</td>
                            <td className="py-3">{formatCurrency(position.avgPrice, position.symbol)}</td>
                            <td className="py-3">{formatCurrency(currentPrice, position.symbol)}</td>
                            <td className="py-3">{formatCurrency(totalValue, position.symbol)}</td>
                            <td className={`py-3 ${gainLoss >= 0 ? 'trend-up' : 'trend-down'}`}>
                              {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss, position.symbol)} ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Watchlist */}
            <div className="lg:col-span-1 glass rounded-xl p-6 border border-border/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Star className="size-5 text-muted-foreground" />
                  <h2 className="text-xl font-medium">Watchlist</h2>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex items-center">
                    <Input
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      placeholder="Add symbol"
                      className="h-9 pr-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 absolute right-0"
                      onClick={handleAddSymbol}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {watchlist.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-3">
                    <Star className="size-12 text-muted-foreground/30" />
                  </div>
                  <h3 className="font-medium mb-2">Your watchlist is empty</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add stocks to your watchlist to track them easily</p>
                  <Button
                    onClick={() => navigate("/stock-analysis")}
                    className="gap-2"
                  >
                    Browse Stocks
                    <LineChart className="size-4" />
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="space-y-4">
                  {[...Array(watchlist.length || 3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlistData.map((stock) => (
                    <div key={stock.symbol} className="p-3 border rounded-lg border-border/20 hover:bg-secondary/20">
                      <div className="flex justify-between items-start">
                        <div className="cursor-pointer" onClick={() => navigate(`/stock-analysis?symbol=${stock.symbol}`)}>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                        </div>
                        <div>
                          <div className="font-medium text-right">{formatCurrency(stock.price, stock.symbol)}</div>
                          <div className={`text-sm flex items-center justify-end ${stock.changePercent >= 0 ? "trend-up" : "trend-down"}`}>
                            {stock.changePercent >= 0 ? (
                              <ArrowUpRight className="size-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="size-3 mr-1" />
                            )}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => removeFromWatchlist(stock.symbol)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Market News */}
          <div className="glass rounded-xl p-6 border border-border/30">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="size-5 text-muted-foreground" />
              <h2 className="text-xl font-medium">Market News</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => {
                const date = new Date();
                date.setHours(date.getHours() - i * 2);
                
                const sources = ["Bloomberg", "CNBC", "Reuters", "Financial Times", "Yahoo Finance", "MarketWatch"];
                const titles = [
                  "Markets Rally on Strong Economic Data",
                  "Tech Stocks Lead Market Gains",
                  "Federal Reserve Signals Interest Rate Path",
                  "Inflation Data Better Than Expected",
                  "Retail Sales Show Surprising Strength",
                  "Bank Earnings Beat Expectations",
                ];
                
                return (
                  <div key={i} className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                    <h3 className="font-medium mb-2">{titles[i % titles.length]}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{sources[i % sources.length]}</span>
                      <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
