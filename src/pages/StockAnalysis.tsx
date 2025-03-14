import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ExternalLink, 
  DollarSign, 
  BarChart4, 
  Newspaper, 
  Star, 
  Percent, 
  TrendingUp, 
  TrendingDown,
  LineChart,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  StarOff,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/ui/SearchBar";
import CustomChart from "@/components/ui/CustomChart";
import { useStockData, useWatchlist } from "@/hooks/useStockData";
import { formatNumber, generateTechnicalIndicators } from "@/utils/stockUtils";
import { formatCurrency } from "@/utils/apiUtils";
import { getAIRecommendation } from "@/utils/aiUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StockAnalysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchSymbol, setSearchSymbol] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "technicals" | "news" | "ai">("overview");
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Get the symbol from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const symbol = params.get("symbol");
    if (symbol) {
      setSearchSymbol(symbol);
    }
  }, [location.search]);
  
  // Fetch stock data using our custom hook
  const { stockData, isLoading, error, setSymbol } = useStockData(searchSymbol);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  
  // Initialize technicals
  const [technicals, setTechnicals] = useState<any | null>(null);
  
  // Update data when stock data changes
  useEffect(() => {
    if (stockData) {
      // Generate technical indicators
      setTechnicals(generateTechnicalIndicators(stockData.price, stockData.changePercent));
      
      // Get AI recommendation
      const fetchAIRecommendation = async () => {
        setIsLoadingAI(true);
        try {
          const recommendation = await getAIRecommendation(stockData);
          setAiRecommendation(recommendation);
        } catch (error) {
          console.error("Error getting AI recommendation:", error);
          // Set fallback recommendation
          setAiRecommendation({
            summary: `${stockData.name} shows ${stockData.changePercent > 0 ? 'positive' : 'negative'} movement with current market conditions.`,
            recommendation: stockData.changePercent > 2 ? "Buy" : stockData.changePercent < -2 ? "Sell" : "Hold",
            confidenceScore: 0.6,
            reasons: [
              `Current price is ${stockData.currency === 'INR' ? '₹' : '$'}${stockData.price}`,
              `${stockData.changePercent > 0 ? 'Up' : 'Down'} ${Math.abs(stockData.changePercent).toFixed(2)}% recently`,
              `P/E ratio is ${stockData.peRatio > 25 ? 'high' : stockData.peRatio < 15 ? 'low' : 'moderate'} at ${stockData.peRatio.toFixed(2)}`
            ],
            riskLevel: stockData.changePercent > 5 || stockData.changePercent < -5 ? "High" : "Medium",
            shortTermOutlook: `Expect ${stockData.changePercent > 0 ? 'continued growth' : 'potential recovery'} in the short term.`,
            longTermOutlook: `Long-term prospects appear ${stockData.peRatio < 20 ? 'favorable' : 'challenging'} based on current valuation.`
          });
        } finally {
          setIsLoadingAI(false);
        }
      };
      
      fetchAIRecommendation();
    }
  }, [stockData]);
  
  // Handle search
  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Ensure all stocks have NSE: prefix
      let formattedQuery = query.toUpperCase();
      if (!formattedQuery.startsWith('NSE:')) {
        formattedQuery = `NSE:${formattedQuery}`;
      }
      
      navigate(`/stock-analysis?symbol=${formattedQuery}`);
      setSymbol(formattedQuery);
    }
  };
  
  // Handle watchlist toggle
  const handleWatchlistToggle = () => {
    if (!stockData) return;
    
    if (isInWatchlist(stockData.symbol)) {
      removeFromWatchlist(stockData.symbol);
    } else {
      addToWatchlist(stockData.symbol);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-28 pb-16">
        <div className="container-padding mx-auto max-w-7xl">
          {/* Search Section */}
          <div className="mb-8 max-w-3xl mx-auto">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              placeholder="भारतीय स्टॉक खोजें (जैसे: RELIANCE, TCS, INFY, HDFC)"
            />
          </div>
          
          {/* Content Section */}
          {isLoading ? (
            <div className="glass rounded-xl p-8 border border-border/30 flex flex-col items-center justify-center h-[400px]">
              <LineChart className="size-12 text-primary/40 animate-pulse-subtle mb-4" />
              <p className="text-lg text-muted-foreground">Loading stock data...</p>
            </div>
          ) : error ? (
            <div className="glass rounded-xl p-8 border border-border/30 flex flex-col items-center justify-center h-[400px]">
              <Info className="size-12 text-destructive/60 mb-4" />
              <p className="text-lg font-medium mb-2">Error Loading Data</p>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate("/")}>Return to Home</Button>
            </div>
          ) : stockData ? (
            <>
              {/* Stock Header */}
              <div className="glass rounded-xl p-6 border border-border/30 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold">{stockData.symbol.replace('NSE:', '')}</h1>
                      <span className="text-muted-foreground">{stockData.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl font-semibold">{formatCurrency(stockData.price, stockData.currency)}</div>
                      <div className={`flex items-center gap-1 text-lg ${stockData.change >= 0 ? "trend-up" : "trend-down"}`}>
                        {stockData.change >= 0 ? (
                          <ArrowUpRight className="size-5" />
                        ) : (
                          <ArrowDownRight className="size-5" />
                        )}
                        <span>{formatCurrency(Math.abs(stockData.change), stockData.currency)}</span>
                        <span>({Math.abs(stockData.changePercent).toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleWatchlistToggle}
                      className={isInWatchlist(stockData.symbol) ? "text-primary" : ""}
                    >
                      {isInWatchlist(stockData.symbol) ? (
                        <Star className="size-5" />
                      ) : (
                        <StarOff className="size-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="technicals">Technical Analysis</TabsTrigger>
                  <TabsTrigger value="ai">
                    <div className="flex items-center gap-2">
                      <Brain className="size-4" />
                      AI Analysis
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart */}
                    <div className="glass rounded-xl p-6 border border-border/30">
                      <CustomChart data={stockData.chartData} />
                    </div>

                    {/* Key Statistics */}
                    <div className="glass rounded-xl p-6 border border-border/30">
                      <h2 className="text-lg font-semibold mb-4">Key Statistics</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Market Cap</p>
                          <p className="font-medium">{formatCurrency(stockData.marketCap, stockData.currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Volume</p>
                          <p className="font-medium">{formatNumber(stockData.volume)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">P/E Ratio</p>
                          <p className="font-medium">{stockData.peRatio?.toFixed(2) || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">52 Week High</p>
                          <p className="font-medium">{formatCurrency(stockData.week52High, stockData.currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">52 Week Low</p>
                          <p className="font-medium">{formatCurrency(stockData.week52Low, stockData.currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Volume</p>
                          <p className="font-medium">{formatNumber(stockData.avgVolume)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="technicals">
                  <div className="glass rounded-xl p-6 border border-border/30">
                    <h2 className="text-lg font-semibold mb-4">Technical Analysis</h2>
                    {technicals && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(technicals).map(([key, value]: [string, any]) => (
                          <div key={key} className="p-4 rounded-lg bg-card">
                            <p className="text-sm text-muted-foreground mb-1">{key}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-medium ${value.signal === 'Buy' ? 'text-green-500' : value.signal === 'Sell' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {value.signal}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({value.value})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ai">
                  <div className="glass rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-2 mb-6">
                      <Brain className="size-6 text-primary" />
                      <h2 className="text-lg font-semibold">AI Analysis & Recommendations</h2>
                    </div>

                    {isLoadingAI ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-muted-foreground">Analyzing stock data...</p>
                      </div>
                    ) : aiRecommendation ? (
                      <div className="space-y-6">
                        {/* Summary and Recommendation */}
                        <div>
                          <h3 className="font-medium mb-2">Summary</h3>
                          <p className="text-muted-foreground">{aiRecommendation.summary}</p>
                          <div className="mt-4 flex items-center gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Recommendation</p>
                              <span className={`text-lg font-medium ${
                                aiRecommendation.recommendation === 'Buy' ? 'text-green-500' :
                                aiRecommendation.recommendation === 'Sell' ? 'text-red-500' :
                                'text-yellow-500'
                              }`}>
                                {aiRecommendation.recommendation}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                              <span className="text-lg font-medium">{(aiRecommendation.confidenceScore * 100).toFixed(0)}%</span>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Risk Level</p>
                              <span className={`text-lg font-medium ${
                                aiRecommendation.riskLevel === 'Low' ? 'text-green-500' :
                                aiRecommendation.riskLevel === 'High' ? 'text-red-500' :
                                'text-yellow-500'
                              }`}>
                                {aiRecommendation.riskLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Key Points */}
                        <div>
                          <h3 className="font-medium mb-3">Key Reasons</h3>
                          <ul className="space-y-2">
                            {aiRecommendation.reasons.map((point: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span className="text-muted-foreground">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Outlook */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium mb-3">Short-Term Outlook</h3>
                            <p className="text-muted-foreground">{aiRecommendation.shortTermOutlook}</p>
                          </div>
                          <div>
                            <h3 className="font-medium mb-3">Long-Term Outlook</h3>
                            <p className="text-muted-foreground">{aiRecommendation.longTermOutlook}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Unable to generate AI recommendation at this time.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="glass rounded-xl p-8 border border-border/30 text-center">
              <h2 className="text-xl font-semibold mb-4">भारतीय स्टॉक खोजें</h2>
              <p className="text-muted-foreground mb-6">
                ऊपर दिए गए सर्च बार में स्टॉक सिंबल या कंपनी का नाम दर्ज करें।
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div>
                  <h3 className="text-sm font-medium mb-2">लोकप्रिय स्टॉक्स</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["NSE:RELIANCE", "NSE:TCS", "NSE:INFY", "NSE:HDFCBANK"].map((symbol) => (
                      <Button
                        key={symbol}
                        variant="outline"
                        onClick={() => handleSearch(symbol)}
                        className="text-sm"
                      >
                        {symbol.replace('NSE:', '')}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">इंडेक्स</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["NSE:NIFTY", "NSE:BANKNIFTY", "NSE:SENSEX", "NSE:NIFTYIT"].map((symbol) => (
                      <Button
                        key={symbol}
                        variant="outline"
                        onClick={() => handleSearch(symbol)}
                        className="text-sm"
                      >
                        {symbol.replace('NSE:', '')}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StockAnalysis;
