
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, BarChart2, LineChart, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/ui/SearchBar";
import MarketOverview from "@/components/ui/MarketOverview";
import StockCard from "@/components/ui/StockCard";
import { fetchMarketIndices, fetchTrendingStocks } from "@/hooks/useStockData";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [trendingStocks, setTrendingStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState({
    indices: true,
    trending: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const indices = await fetchMarketIndices();
        setMarketIndices(indices);
        setIsLoading(prev => ({ ...prev, indices: false }));
        
        const trending = await fetchTrendingStocks();
        setTrendingStocks(trending);
        setIsLoading(prev => ({ ...prev, trending: false }));
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading({ indices: false, trending: false });
      }
    };
    
    fetchData();
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/stock-analysis?symbol=${query.toUpperCase()}`);
    }
  };

  const handleStockClick = (symbol: string) => {
    navigate(`/stock-analysis?symbol=${symbol}`);
  };

  const features = [
    {
      icon: <Search className="size-6 text-primary" />,
      title: "Stock Analysis",
      description: "Get detailed information and real-time data for any stock with AI-powered insights."
    },
    {
      icon: <BarChart2 className="size-6 text-primary" />,
      title: "Market Trends",
      description: "Stay updated with the latest market trends, sector performance, and economic indicators."
    },
    {
      icon: <LineChart className="size-6 text-primary" />,
      title: "Interactive Charts",
      description: "Visualize stock performance with interactive charts and technical indicators."
    },
    {
      icon: <TrendingUp className="size-6 text-primary" />,
      title: "AI Recommendations",
      description: "Get buy, sell, or hold recommendations based on advanced AI analysis."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 container-padding mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
            AI-Powered Stock Analysis
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-slide-down">
            Intelligent Stock Analysis with AI
          </h1>
          <p className="text-lg text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto animate-slide-down" style={{animationDelay: "0.1s"}}>
            Get real-time market data, AI-driven stock recommendations, and interactive charts to make smarter investment decisions.
          </p>
          
          <div className="max-w-2xl mx-auto animate-slide-down" style={{animationDelay: "0.2s"}}>
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for a stock symbol (e.g., AAPL, MSFT, GOOGL)"
              className="mb-4"
            />
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button 
                variant="default" 
                size="lg" 
                onClick={() => navigate("/stock-analysis")}
                className="gap-2"
              >
                Analyze Stocks
                <ArrowRight className="size-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate("/market-trends")}
              >
                View Market Trends
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Market Overview */}
      <section className="py-16 bg-secondary/50">
        <div className="container-padding mx-auto">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">
              Market Overview
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Market Indices */}
              <div className="lg:col-span-1">
                {isLoading.indices ? (
                  <div className="glass rounded-xl p-6 border border-border/30 h-[350px] flex items-center justify-center">
                    <div className="animate-pulse-subtle text-center">
                      <BarChart2 className="size-8 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading market data...</p>
                    </div>
                  </div>
                ) : (
                  <MarketOverview indices={marketIndices} />
                )}
              </div>
              
              {/* Trending Stocks */}
              <div className="lg:col-span-2">
                <div className="glass rounded-xl p-6 border border-border/30 h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="size-5 text-muted-foreground" />
                    <h2 className="font-medium">Trending Stocks</h2>
                  </div>
                  
                  {isLoading.trending ? (
                    <div className="animate-pulse-subtle grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div 
                          key={i} 
                          className="stock-card h-[130px] flex flex-col justify-between"
                        >
                          <div className="w-1/2 h-4 bg-muted-foreground/10 rounded"></div>
                          <div className="w-1/3 h-3 bg-muted-foreground/10 rounded"></div>
                          <div className="w-2/3 h-5 bg-muted-foreground/10 rounded"></div>
                          <div className="w-1/2 h-3 bg-muted-foreground/10 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trendingStocks.slice(0, 6).map((stock) => (
                        <StockCard
                          key={stock.symbol}
                          symbol={stock.symbol}
                          name={stock.name}
                          price={stock.price}
                          change={stock.change}
                          changePercent={stock.changePercent}
                          onClick={() => handleStockClick(stock.symbol)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container-padding mx-auto">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">
              Powerful Features
            </h2>
            <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-12">
              Our platform provides you with all the tools you need to make informed investment decisions
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="glass p-6 rounded-xl border border-border/30 transition-all duration-300 hover:shadow-md"
                >
                  <div className="mb-4 inline-block p-3 rounded-lg bg-primary/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container-padding mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Ready to make smarter investment decisions?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start analyzing stocks and tracking the market to gain valuable insights for your investment strategy.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/stock-analysis")}
              className="gap-2"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
