import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, TrendingUp, Calendar, BarChart2, Heart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/Chart";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchMarketIndices, fetchTrendingStocks } from "@/hooks/useStockData";
import { toast } from "sonner";

const timeframeOptions = [
  { value: "1D", label: "1D" },
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
];

// Chart colors config
const chartConfig = {
  primary: {
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))",
    },
  },
  positive: {
    theme: {
      light: "hsl(var(--success))",
      dark: "hsl(var(--success))",
    },
  },
  negative: {
    theme: {
      light: "hsl(var(--destructive))",
      dark: "hsl(var(--destructive))",
    },
  },
};

// Pie chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const MarketTrends = () => {
  const [activeTab, setActiveTab] = useState("indices");
  const [timeframe, setTimeframe] = useState("1W");
  const [marketIndices, setMarketIndices] = useState([]);
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const indices = await fetchMarketIndices();
        const trending = await fetchTrendingStocks();
        setMarketIndices(indices);
        setTrendingStocks(trending);
      } catch (error) {
        console.error("Error fetching market data:", error);
        toast.error("Failed to load market data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sector distribution data
  const sectorData = [
    { name: "Technology", value: 35 },
    { name: "Healthcare", value: 20 },
    { name: "Finance", value: 15 },
    { name: "Consumer", value: 12 },
    { name: "Energy", value: 18 },
  ];

  // Sample earnings data
  const earningsData = [
    { name: "Jan", earnings: 4000 },
    { name: "Feb", earnings: 3000 },
    { name: "Mar", earnings: 5000 },
    { name: "Apr", earnings: 2780 },
    { name: "May", earnings: 1890 },
    { name: "Jun", earnings: 2390 },
    { name: "Jul", earnings: 3490 },
  ];

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Market Trends
        </h1>
        <p className="text-muted-foreground mt-2">
          Stay updated with the latest market movements and trends
        </p>
      </div>

      <Tabs
        defaultValue="indices"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="indices">Market Indices</TabsTrigger>
            <TabsTrigger value="trending">Trending Stocks</TabsTrigger>
            <TabsTrigger value="sectors">Sector Analysis</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Calendar className="h-4 w-4" />
              {timeframe}
            </Button>
          </div>
        </div>

        <TabsContent value="indices" className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marketIndices.map((index, i) => (
                  <Card key={i} className={index.change >= 0 ? "border-success/20" : "border-destructive/20"}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{index.name}</CardTitle>
                      <CardDescription>{index.region}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-mono text-2xl font-semibold">{index.value.toLocaleString()}</div>
                        <div
                          className={`flex items-center gap-1 font-mono ${
                            index.change >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {index.change >= 0 ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                          {Math.abs(index.change).toFixed(2)} ({Math.abs(index.changePercent).toFixed(2)}%)
                        </div>
                      </div>
                      <div className="h-20">
                        <ChartContainer config={chartConfig}>
                          <AreaChart
                            data={index.data}
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id={`gradientArea-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={index.change >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={index.change >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={index.change >= 0 ? "#22c55e" : "#ef4444"}
                              strokeWidth={2}
                              fillOpacity={1}
                              fill={`url(#gradientArea-${i})`}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Global Markets Comparison
                  </CardTitle>
                  <CardDescription>Performance comparison across major indices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ChartContainer config={chartConfig}>
                      <BarChart
                        data={marketIndices}
                        margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="changePercent" name="Change %" fill="var(--color-primary)" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Most Active Stocks
                    </CardTitle>
                    <CardDescription>Stocks with highest trading volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-full divide-y divide-border">
                        <thead>
                          <tr className="text-xs text-muted-foreground font-medium">
                            <th className="px-4 py-3 text-left">Symbol</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right">Change</th>
                            <th className="px-4 py-3 text-right">% Change</th>
                            <th className="px-4 py-3 text-right">Volume</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {trendingStocks.map((stock, i) => (
                            <tr key={i} className="text-sm font-mono">
                              <td className="px-4 py-3 font-medium">{stock.symbol}</td>
                              <td className="px-4 py-3">{stock.name}</td>
                              <td className="px-4 py-3 text-right">
                                ${stock.price.toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right ${
                                  stock.change >= 0 ? "text-success" : "text-destructive"
                                }`}
                              >
                                {stock.change >= 0 ? "+" : ""}
                                {stock.change.toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right ${
                                  stock.change >= 0 ? "text-success" : "text-destructive"
                                }`}
                              >
                                {stock.change >= 0 ? "+" : ""}
                                {stock.changePercent.toFixed(2)}%
                              </td>
                              <td className="px-4 py-3 text-right">
                                {(stock.volume / 1000000).toFixed(1)}M
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Gainers & Losers</CardTitle>
                      <CardDescription>Best and worst performing stocks today</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ChartContainer config={chartConfig}>
                          <BarChart
                            data={[...trendingStocks]
                              .sort((a, b) => b.changePercent - a.changePercent)
                              .slice(0, 5)}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[-5, 8]} />
                            <YAxis type="category" dataKey="symbol" width={60} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="changePercent" name="Change %">
                              {[...trendingStocks]
                                .sort((a, b) => b.changePercent - a.changePercent)
                                .slice(0, 5)
                                .map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.changePercent >= 0 ? "#22c55e" : "#ef4444"}
                                  />
                                ))}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Volume Distribution</CardTitle>
                      <CardDescription>Trading volume by stock</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ChartContainer config={chartConfig}>
                          <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <Pie
                              data={trendingStocks.slice(0, 5)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={2}
                              dataKey="volume"
                              nameKey="symbol"
                              label={({ symbol }) => symbol}
                            >
                              {trendingStocks.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Market Cap by Sector</CardTitle>
                <CardDescription>Distribution of market capitalization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ChartContainer config={chartConfig}>
                    <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sector Performance</CardTitle>
                <CardDescription>YTD performance by sector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ChartContainer config={chartConfig}>
                    <BarChart
                      data={sectorData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 40]} />
                      <YAxis type="category" dataKey="name" width={80} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" name="Performance %" fill="var(--color-primary)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Corporate Earnings Trends</CardTitle>
              <CardDescription>Average earnings trends across sectors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer config={chartConfig}>
                  <LineChart
                    data={earningsData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketTrends;
