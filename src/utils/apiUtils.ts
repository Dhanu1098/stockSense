import { toast } from "sonner";
import * as breezeUtils from './breezeUtils';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || "demo";

// Add a flag to track API call count and prevent exceeding limits
let apiCallCount = 0;
const API_CALL_LIMIT = 5; // Free tier limit is 5 calls per minute
const resetApiCallCount = () => {
  setTimeout(() => {
    apiCallCount = 0;
    console.log("API call count reset");
  }, 60000); // Reset after 1 minute
};

// Helper function to check if we should use real API or mock data
const shouldUseMockData = () => {
  // Check if we've reached the API call limit
  if (apiCallCount >= API_CALL_LIMIT) {
    console.warn("API call limit reached, using mock data");
    return true;
  }
  
  // Increment the API call count
  apiCallCount++;
  if (apiCallCount === 1) {
    resetApiCallCount();
  }
  
  // Try to use real data
  return false;
};

// Format large numbers for better readability
export const formatCurrency = (num: number, symbol: string = ''): string => {
  const isIndianStock = symbol.startsWith('NSE:');
  
  if (isIndianStock) {
    // Format in Indian Rupees
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } else {
    // Format in US Dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
};

/**
 * Fetch stock quote data from Alpha Vantage API or Breeze API
 */
export const fetchStockQuote = async (symbol: string) => {
  try {
    // Try to get data from Breeze API first if available
    if (breezeUtils.isBreezeAPIAvailable()) {
      const breezeData = await breezeUtils.getStockQuote(symbol);
      if (breezeData) {
        toast.success(`Real-time data loaded for ${symbol} from Breeze API`);
        return breezeData;
      }
    }
    
    // If Breeze API is not available or returns no data, fall back to Alpha Vantage
    // Check if we should use mock data due to API limits
    if (shouldUseMockData()) {
      toast.info(`Using cached data for ${symbol} (API limit reached)`);
      return generateMockStockData(symbol);
    }
    
    // For Indian stocks, we need to handle the NSE: prefix
    const isIndianStock = symbol.startsWith('NSE:');
    const apiSymbol = isIndianStock ? symbol.replace('NSE:', '') + '.NS' : symbol;
    
    console.log(`Fetching data for ${symbol} (API symbol: ${apiSymbol})`);
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${apiSymbol}&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API response:', data);
    
    // Check if we have the expected data structure
    if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
      const quote = data["Global Quote"];
      
      // Show success toast
      toast.success(`Real-time data loaded for ${symbol}`);
      
      return {
        symbol: symbol, // Keep the original symbol with NSE: prefix if present
        price: parseFloat(quote["05. price"]),
        change: parseFloat(quote["09. change"]),
        changePercent: parseFloat(quote["10. change percent"].replace('%', '')),
        volume: parseInt(quote["06. volume"]),
        name: await fetchCompanyName(symbol),
      };
    } else if (data.Note && data.Note.includes("API call frequency")) {
      // API limit reached
      console.warn("API call frequency exceeded:", data.Note);
      toast.warning("API limit reached. Using cached data temporarily.");
      return generateMockStockData(symbol);
    } else {
      // If using demo key or no data available
      console.warn("No data available for", symbol, "API response:", data);
      toast.warning(`No data available for ${symbol}. Using estimated values.`);
      return generateMockStockData(symbol);
    }
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    toast.error(`Failed to fetch data for ${symbol}. Using estimated values.`);
    return generateMockStockData(symbol);
  }
};

/**
 * Fetch company overview data from Alpha Vantage API
 */
export const fetchCompanyOverview = async (symbol: string) => {
  try {
    // Check if we should use mock data due to API limits
    if (shouldUseMockData()) {
      toast.info(`Using cached company data for ${symbol} (API limit reached)`);
      return generateMockCompanyOverview(symbol);
    }
    
    // For Indian stocks, we need to handle the NSE: prefix
    const isIndianStock = symbol.startsWith('NSE:');
    const apiSymbol = isIndianStock ? symbol.replace('NSE:', '') + '.NS' : symbol;
    
    console.log(`Fetching company overview for ${symbol} (API symbol: ${apiSymbol})`);
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${apiSymbol}&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Company overview API response:', data);
    
    // Check if we have the expected data structure
    if (data.Symbol) {
      toast.success(`Company data loaded for ${symbol}`);
      
      return {
        symbol: data.Symbol,
        name: data.Name,
        description: data.Description,
        exchange: data.Exchange,
        industry: data.Industry,
        sector: data.Sector,
        marketCap: data.MarketCapitalization,
        peRatio: parseFloat(data.PERatio) || 0,
        eps: parseFloat(data.EPS) || 0,
        dividend: parseFloat(data.DividendYield) * 100 || 0,
        targetPrice: parseFloat(data.AnalystTargetPrice) || 0,
      };
    } else if (data.Note && data.Note.includes("API call frequency")) {
      // API limit reached
      console.warn("API call frequency exceeded:", data.Note);
      toast.warning("API limit reached. Using cached company data temporarily.");
      return generateMockCompanyOverview(symbol);
    } else {
      // If using demo key or reached API limit, return mock data
      console.warn("No company data available for", symbol, "API response:", data);
      toast.warning(`No company data available for ${symbol}. Using estimated values.`);
      return generateMockCompanyOverview(symbol);
    }
  } catch (error) {
    console.error("Error fetching company overview:", error);
    toast.error(`Failed to fetch company data for ${symbol}. Using estimated values.`);
    return generateMockCompanyOverview(symbol);
  }
};

/**
 * Fetch time series data for stock chart from Alpha Vantage API or Breeze API
 */
export const fetchTimeSeriesData = async (symbol: string, interval = 'daily', outputSize = 'compact') => {
  try {
    // Try to get data from Breeze API first if available
    if (breezeUtils.isBreezeAPIAvailable()) {
      const breezeData = await breezeUtils.getHistoricalData(symbol, interval);
      if (breezeData) {
        toast.success(`Chart data loaded for ${symbol} from Breeze API`);
        return breezeData;
      }
    }
    
    // If Breeze API is not available or returns no data, fall back to Alpha Vantage
    // Check if we should use mock data due to API limits
    if (shouldUseMockData()) {
      toast.info(`Using cached chart data for ${symbol} (API limit reached)`);
      return generateMockChartData(symbol);
    }
    
    // For Indian stocks, we need to handle the NSE: prefix
    const apiSymbol = symbol.startsWith('NSE:') ? symbol.replace('NSE:', '') + '.NS' : symbol;
    
    const func = interval === 'intraday' 
      ? 'TIME_SERIES_INTRADAY' 
      : interval === 'weekly' 
        ? 'TIME_SERIES_WEEKLY' 
        : 'TIME_SERIES_DAILY';
    
    const intervalParam = interval === 'intraday' ? '&interval=5min' : '';
    
    console.log(`Fetching time series for ${symbol} (API symbol: ${apiSymbol})`);
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=${func}&symbol=${apiSymbol}${intervalParam}&outputsize=${outputSize}&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Time series API response keys:', Object.keys(data));
    
    // Get the time series key based on the interval
    const timeSeriesKey = interval === 'intraday' 
      ? 'Time Series (5min)' 
      : interval === 'weekly' 
        ? 'Weekly Time Series' 
        : 'Time Series (Daily)';
    
    if (data[timeSeriesKey] && Object.keys(data[timeSeriesKey]).length > 0) {
      const timeSeries = data[timeSeriesKey];
      const chartData = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
        date: date,
        value: parseFloat(values["4. close"]),
      })).reverse();
      
      toast.success(`Chart data loaded for ${symbol}`);
      return chartData;
    } else if (data.Note && data.Note.includes("API call frequency")) {
      // API limit reached
      console.warn("API call frequency exceeded:", data.Note);
      toast.warning("API limit reached for chart data. Using estimated values.");
      return generateMockChartData(symbol);
    } else {
      // If using demo key or reached API limit, return mock data
      console.warn("Using mock data for chart", symbol, "API response keys:", Object.keys(data));
      toast.warning(`No chart data available for ${symbol}. Using estimated values.`);
      return generateMockChartData(symbol);
    }
  } catch (error) {
    console.error("Error fetching time series data:", error);
    toast.error(`Failed to fetch chart data for ${symbol}. Using estimated values.`);
    return generateMockChartData(symbol);
  }
};

/**
 * Fetch company name from Alpha Vantage API
 */
export const fetchCompanyName = async (symbol: string) => {
  try {
    // Check if we should use mock data due to API limits
    if (shouldUseMockData()) {
      // Use predefined names if available
      const indianCompanies: Record<string, string> = {
        "NSE:RELIANCE": "Reliance Industries Ltd.",
        "NSE:TCS": "Tata Consultancy Services Ltd.",
        "NSE:HDFCBANK": "HDFC Bank Ltd.",
        "NSE:INFY": "Infosys Ltd.",
        "NSE:ICICIBANK": "ICICI Bank Ltd.",
        "NSE:BHARTIARTL": "Bharti Airtel Ltd.",
        "NSE:HINDUNILVR": "Hindustan Unilever Ltd.",
        "NSE:SBIN": "State Bank of India",
        "NSE:WIPRO": "Wipro Ltd.",
        "NSE:LT": "Larsen & Toubro Ltd.",
        "NSE:NIFTY50": "NIFTY 50 Index",
        "NSE:BANKNIFTY": "Bank NIFTY Index",
        "NSE:NIFTYIT": "NIFTY IT Index"
      };
      
      const usCompanies: Record<string, string> = {
        "AAPL": "Apple Inc.",
        "MSFT": "Microsoft Corporation",
        "GOOGL": "Alphabet Inc.",
        "AMZN": "Amazon.com Inc.",
        "META": "Meta Platforms Inc.",
        "TSLA": "Tesla Inc.",
        "NVDA": "NVIDIA Corporation",
        "NFLX": "Netflix Inc.",
        "DIS": "The Walt Disney Company",
        "IBM": "International Business Machines",
      };
      
      if (symbol.startsWith('NSE:') && indianCompanies[symbol]) {
        return indianCompanies[symbol];
      } else if (usCompanies[symbol]) {
        return usCompanies[symbol];
      } else {
        return `${symbol.replace('NSE:', '')} ${symbol.startsWith('NSE:') ? 'Ltd.' : 'Corporation'}`;
      }
    }
    
    // For Indian stocks, we can use our predefined names or search with the correct format
    if (symbol.startsWith('NSE:')) {
      // Check if we have the name in our predefined list
      const indianCompanies: Record<string, string> = {
        "NSE:RELIANCE": "Reliance Industries Ltd.",
        "NSE:TCS": "Tata Consultancy Services Ltd.",
        "NSE:HDFCBANK": "HDFC Bank Ltd.",
        "NSE:INFY": "Infosys Ltd.",
        "NSE:ICICIBANK": "ICICI Bank Ltd.",
        "NSE:BHARTIARTL": "Bharti Airtel Ltd.",
        "NSE:HINDUNILVR": "Hindustan Unilever Ltd.",
        "NSE:SBIN": "State Bank of India",
        "NSE:WIPRO": "Wipro Ltd.",
        "NSE:LT": "Larsen & Toubro Ltd.",
        "NSE:NIFTY50": "NIFTY 50 Index",
        "NSE:BANKNIFTY": "Bank NIFTY Index",
        "NSE:NIFTYIT": "NIFTY IT Index"
      };
      
      if (indianCompanies[symbol]) {
        return indianCompanies[symbol];
      }
      
      // If not in our list, search with the .NS suffix
      const searchSymbol = symbol.replace('NSE:', '') + '.NS';
      const response = await fetch(
        `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${searchSymbol}&apikey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.bestMatches && data.bestMatches.length > 0) {
        return data.bestMatches[0]["2. name"];
      } else {
        // If no match found, return a formatted name
        return `${symbol.replace('NSE:', '')} (NSE)`;
      }
    }
    
    // For non-Indian stocks, use the original approach
    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${symbol}&apikey=${API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.bestMatches && data.bestMatches.length > 0) {
      return data.bestMatches[0]["2. name"];
    } else {
      // If using demo key or reached API limit, use mocked name
      const companies: Record<string, string> = {
        "AAPL": "Apple Inc.",
        "MSFT": "Microsoft Corporation",
        "GOOGL": "Alphabet Inc.",
        "AMZN": "Amazon.com Inc.",
        "META": "Meta Platforms Inc.",
        "TSLA": "Tesla Inc.",
        "NVDA": "NVIDIA Corporation",
        "NFLX": "Netflix Inc.",
        "DIS": "The Walt Disney Company",
        "IBM": "International Business Machines",
      };
      
      return companies[symbol] || `${symbol} Corporation`;
    }
  } catch (error) {
    console.error("Error fetching company name:", error);
    return `${symbol.replace('NSE:', '')} ${symbol.startsWith('NSE:') ? 'Ltd.' : 'Corporation'}`;
  }
};

/**
 * Fetch market indices from Alpha Vantage API or Breeze API
 */
export const fetchMarketIndices = async () => {
  try {
    // Try to get data from Breeze API first if available
    if (breezeUtils.isBreezeAPIAvailable()) {
      const breezeData = await breezeUtils.getMarketIndices();
      if (breezeData && breezeData.length > 0) {
        toast.success(`Market indices loaded from Breeze API`);
        return breezeData;
      }
    }
    
    // If Breeze API is not available or returns no data, fall back to Alpha Vantage
    // Only include Indian indices
    const indexSymbols = [
      // Indian Market Indices - using direct symbols with .NS suffix
      { symbol: "NSE:NIFTY50", apiSymbol: "^NSEI", name: "NIFTY 50", currency: "INR" },
      { symbol: "NSE:BANKNIFTY", apiSymbol: "^NSEBANK", name: "Bank NIFTY", currency: "INR" },
      { symbol: "NSE:NIFTYIT", apiSymbol: "NIFTYIT.NS", name: "NIFTY IT", currency: "INR" },
      { symbol: "NSE:SENSEX", apiSymbol: "^BSESN", name: "SENSEX", currency: "INR" },
      { symbol: "NSE:NIFTYMIDCAP", apiSymbol: "NIFTYMID50.NS", name: "NIFTY Midcap 50", currency: "INR" },
      { symbol: "NSE:NIFTYAUTO", apiSymbol: "CNXAUTO.NS", name: "NIFTY Auto", currency: "INR" }
    ];
    
    console.log("Fetching market indices...");
    
    // Check if we should use mock data due to API limits
    if (shouldUseMockData()) {
      toast.info("Using cached market indices (API limit reached)");
      return [
        generateMockIndexData("NIFTY 50", "INR"),
        generateMockIndexData("Bank NIFTY", "INR"),
        generateMockIndexData("NIFTY IT", "INR"),
        generateMockIndexData("SENSEX", "INR"),
        generateMockIndexData("NIFTY Midcap 50", "INR"),
        generateMockIndexData("NIFTY Auto", "INR")
      ];
    }
    
    const promises = indexSymbols.map(async index => {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${index.apiSymbol}&apikey=${API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Index ${index.name} API response:`, data);
        
        if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
          const quote = data["Global Quote"];
          return {
            name: index.name,
            value: parseFloat(quote["05. price"]),
            change: parseFloat(quote["09. change"]),
            changePercent: parseFloat(quote["10. change percent"].replace('%', '')),
            currency: index.currency,
            isMock: false
          };
        } else if (data.Note && data.Note.includes("API call frequency")) {
          // API limit reached
          console.warn(`API call frequency exceeded for ${index.name}:`, data.Note);
          return generateMockIndexData(index.name, index.currency);
        } else {
          // If API limit reached or error, use mock data
          console.warn(`Using mock data for ${index.name}`);
          return generateMockIndexData(index.name, index.currency);
        }
      } catch (error) {
        console.error(`Error fetching ${index.name}:`, error);
        return generateMockIndexData(index.name, index.currency);
      }
    });
    
    const results = await Promise.all(promises);
    
    // Show success toast if at least one real index was fetched
    const realIndicesCount = results.filter(index => !index.isMock).length;
    if (realIndicesCount > 0) {
      toast.success(`Loaded ${realIndicesCount} market indices with real-time data`);
    }
    
    return results;
  } catch (error) {
    console.error("Error fetching market indices:", error);
    toast.error("Failed to fetch market indices. Using estimated values.");
    
    // Return mock data for all indices
    return [
      generateMockIndexData("NIFTY 50", "INR"),
      generateMockIndexData("Bank NIFTY", "INR"),
      generateMockIndexData("NIFTY IT", "INR"),
      generateMockIndexData("SENSEX", "INR"),
      generateMockIndexData("NIFTY Midcap 50", "INR"),
      generateMockIndexData("NIFTY Auto", "INR")
    ];
  }
};

// Generate mock index data
const generateMockIndexData = (name: string, currency: string = "USD") => {
  let baseValue = 0;
  let changeRange = 0;
  
  // Set appropriate base values for different indices
  if (name === "NIFTY 50") {
    baseValue = 22000 + (Math.random() * 1000 - 500);
    changeRange = 200;
  } else if (name === "Bank NIFTY") {
    baseValue = 48000 + (Math.random() * 2000 - 1000);
    changeRange = 400;
  } else if (name === "NIFTY IT") {
    baseValue = 32000 + (Math.random() * 1500 - 750);
    changeRange = 300;
  } else if (name === "SENSEX") {
    baseValue = 38000 + (Math.random() * 1000 - 500);
    changeRange = 300;
  } else if (name === "NIFTY Midcap 50") {
    baseValue = 16000 + (Math.random() * 500 - 250);
    changeRange = 150;
  } else if (name === "NIFTY Auto") {
    baseValue = 10000 + (Math.random() * 1000);
    changeRange = 100;
  } else {
    // Default values
    baseValue = 10000 + (Math.random() * 1000);
    changeRange = 100;
  }
  
  const change = (Math.random() * changeRange * 2) - changeRange;
  const changePercent = (change / baseValue) * 100;
  const value = baseValue;
  
  return {
    name,
    value,
    change,
    changePercent,
    currency,
    isMock: true // Flag to indicate this is mock data
  };
};

/**
 * Fetch trending stocks
 */
export const fetchTrendingStocks = async () => {
  try {
    // Only include Indian stocks
    const trendingSymbols = [
      "NSE:RELIANCE",
      "NSE:TCS",
      "NSE:HDFCBANK",
      "NSE:INFY",
      "NSE:ICICIBANK",
      "NSE:BHARTIARTL",
      "NSE:HINDUNILVR",
      "NSE:SBIN",
      "NSE:WIPRO",
      "NSE:LT"
    ];
    
    const promises = trendingSymbols.map(symbol => fetchStockQuote(symbol));
    const stocksData = await Promise.all(promises);
    
    return stocksData;
  } catch (error) {
    console.error("Error fetching trending stocks:", error);
    
    // Return mock trending stocks with only Indian stocks
    const trendingSymbols = [
      "NSE:RELIANCE",
      "NSE:TCS",
      "NSE:HDFCBANK",
      "NSE:INFY",
      "NSE:ICICIBANK",
      "NSE:BHARTIARTL",
      "NSE:HINDUNILVR",
      "NSE:SBIN",
      "NSE:WIPRO",
      "NSE:LT"
    ];
    const trending = [];
    
    for (const symbol of trendingSymbols) {
      trending.push(generateMockStockData(symbol));
    }
    
    return trending;
  }
};

/**
 * Fetch news for a specific stock or general market news
 */
export const fetchStockNews = async (symbol = '') => {
  try {
    // For real implementation, you would use a financial news API here
    // Since most news APIs require paid subscriptions, we'll use mock data for now
    return generateMockNews(symbol);
  } catch (error) {
    console.error("Error fetching stock news:", error);
    return generateMockNews(symbol);
  }
};

// Generate mock stock data
const generateMockStockData = (symbol: string) => {
  const isIndianStock = symbol.startsWith('NSE:');
  const stockCode = symbol.replace('NSE:', '');
  
  // Indian companies data with realistic prices
  const indianStocks: Record<string, { name: string, sector: string, price: number, change: number }> = {
    "RELIANCE": { 
      name: "Reliance Industries Ltd.", 
      sector: "Energy", 
      price: 2934.75, 
      change: 23.45 
    },
    "TCS": { 
      name: "Tata Consultancy Services Ltd.", 
      sector: "Technology", 
      price: 3876.20, 
      change: -12.80 
    },
    "HDFCBANK": { 
      name: "HDFC Bank Ltd.", 
      sector: "Financial Services", 
      price: 1678.55, 
      change: 15.30 
    },
    "INFY": { 
      name: "Infosys Ltd.", 
      sector: "Technology", 
      price: 1456.90, 
      change: -8.75 
    },
    "ICICIBANK": { 
      name: "ICICI Bank Ltd.", 
      sector: "Financial Services", 
      price: 1023.45, 
      change: 7.65 
    },
    "BHARTIARTL": { 
      name: "Bharti Airtel Ltd.", 
      sector: "Telecom", 
      price: 1189.30, 
      change: 5.20 
    },
    "HINDUNILVR": { 
      name: "Hindustan Unilever Ltd.", 
      sector: "Consumer Goods", 
      price: 2456.75, 
      change: -18.50 
    },
    "SBIN": { 
      name: "State Bank of India", 
      sector: "Financial Services", 
      price: 745.60, 
      change: 3.25 
    },
    "WIPRO": { 
      name: "Wipro Ltd.", 
      sector: "Technology", 
      price: 478.90, 
      change: -2.35 
    },
    "LT": { 
      name: "Larsen & Toubro Ltd.", 
      sector: "Construction", 
      price: 3245.80, 
      change: 28.45 
    },
    "NIFTY": { 
      name: "NIFTY 50 Index", 
      sector: "Index", 
      price: 22345.60, 
      change: 123.45 
    },
    "BANKNIFTY": { 
      name: "Bank NIFTY Index", 
      sector: "Index", 
      price: 48234.75, 
      change: 234.50 
    },
    "SENSEX": { 
      name: "S&P BSE SENSEX Index", 
      sector: "Index", 
      price: 73456.80, 
      change: 345.70 
    },
    "NIFTYIT": { 
      name: "NIFTY IT Index", 
      sector: "Index", 
      price: 32567.90, 
      change: -156.40 
    }
  };
  
  // US companies data
  const usCompanies: Record<string, { name: string, sector: string }> = {
    "AAPL": { name: "Apple Inc.", sector: "Technology" },
    "MSFT": { name: "Microsoft Corporation", sector: "Technology" },
    "GOOGL": { name: "Alphabet Inc.", sector: "Technology" },
    "AMZN": { name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
    "META": { name: "Meta Platforms Inc.", sector: "Technology" },
    "TSLA": { name: "Tesla Inc.", sector: "Automotive" },
    "NVDA": { name: "NVIDIA Corporation", sector: "Technology" },
    "NFLX": { name: "Netflix Inc.", sector: "Entertainment" },
    "DIS": { name: "The Walt Disney Company", sector: "Entertainment" },
    "IBM": { name: "International Business Machines", sector: "Technology" }
  };
  
  // Generate data based on stock type
  if (isIndianStock && indianStocks[stockCode]) {
    const stockInfo = indianStocks[stockCode];
    const price = stockInfo.price;
    const change = stockInfo.change;
    const changePercent = (change / price) * 100;
    
    return {
      symbol: symbol,
      name: stockInfo.name,
      price: price,
      change: change,
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    };
  } else if (isIndianStock) {
    // For other Indian stocks not in our predefined list
    const basePrice = Math.random() * 4950 + 50;
    const change = (Math.random() * 20) - 10;
    const changePercent = (change / basePrice) * 100;
    
    return {
      symbol: symbol,
      name: `${stockCode} Ltd.`,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    };
  } else {
    // For US stocks
    const basePrice = Math.random() * 450 + 50;
    const change = (Math.random() * 20) - 10;
    const changePercent = (change / basePrice) * 100;
    
    const companyInfo = usCompanies[symbol] || { 
      name: `${symbol} Corporation`, 
      sector: "US Equity" 
    };
    
    return {
      symbol: symbol,
      name: companyInfo.name,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    };
  }
};

// Generate mock company overview data
const generateMockCompanyOverview = (symbol: string) => {
  const isIndianStock = symbol.startsWith('NSE:');
  const stockCode = symbol.replace('NSE:', '');
  
  // Indian companies data with realistic values
  const indianStocks: Record<string, { 
    name: string, 
    sector: string, 
    description: string,
    marketCap: string,
    peRatio: number,
    eps: number,
    dividend: number
  }> = {
    "RELIANCE": { 
      name: "Reliance Industries Ltd.", 
      sector: "Energy", 
      description: "Reliance Industries Limited is an Indian multinational conglomerate company, headquartered in Mumbai. Its diverse businesses include energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.",
      marketCap: "₹18,45,678 Cr",
      peRatio: 28.45,
      eps: 103.15,
      dividend: 2.75
    },
    "TCS": { 
      name: "Tata Consultancy Services Ltd.", 
      sector: "Technology",
      description: "Tata Consultancy Services is an Indian multinational information technology services and consulting company headquartered in Mumbai. It is part of the Tata Group and operates in 149 locations across 46 countries.",
      marketCap: "₹13,56,789 Cr",
      peRatio: 32.67,
      eps: 118.65,
      dividend: 3.15
    },
    "HDFCBANK": { 
      name: "HDFC Bank Ltd.", 
      sector: "Financial Services",
      description: "HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai. It is India's largest private sector bank by assets and market capitalization.",
      marketCap: "₹11,23,456 Cr",
      peRatio: 22.34,
      eps: 75.14,
      dividend: 1.85
    },
    "INFY": { 
      name: "Infosys Ltd.", 
      sector: "Technology",
      description: "Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.",
      marketCap: "₹7,89,123 Cr",
      peRatio: 29.78,
      eps: 48.92,
      dividend: 2.65
    },
    "ICICIBANK": { 
      name: "ICICI Bank Ltd.", 
      sector: "Financial Services",
      description: "ICICI Bank Limited is an Indian multinational banking and financial services company headquartered in Mumbai. It offers a wide range of banking products and financial services to corporate and retail customers.",
      marketCap: "₹6,78,912 Cr",
      peRatio: 21.56,
      eps: 47.47,
      dividend: 1.45
    },
    "BHARTIARTL": { 
      name: "Bharti Airtel Ltd.", 
      sector: "Telecom",
      description: "Bharti Airtel Limited is an Indian multinational telecommunications services company headquartered in New Delhi. It operates in 18 countries across South Asia and Africa.",
      marketCap: "₹5,67,891 Cr",
      peRatio: 34.23,
      eps: 34.74,
      dividend: 1.25
    },
    "HINDUNILVR": { 
      name: "Hindustan Unilever Ltd.", 
      sector: "Consumer Goods",
      description: "Hindustan Unilever Limited is an Indian consumer goods company headquartered in Mumbai. It is a subsidiary of Unilever, a British company.",
      marketCap: "₹6,12,345 Cr",
      peRatio: 68.92,
      eps: 35.65,
      dividend: 4.15
    },
    "SBIN": { 
      name: "State Bank of India", 
      sector: "Financial Services",
      description: "State Bank of India is an Indian multinational, public sector banking and financial services statutory body headquartered in Mumbai. It is a government corporation.",
      marketCap: "₹5,23,456 Cr",
      peRatio: 12.34,
      eps: 60.42,
      dividend: 2.25
    }
  };
  
  // Generate data based on stock type
  if (isIndianStock && indianStocks[stockCode]) {
    const stockInfo = indianStocks[stockCode];
    
    return {
      symbol: symbol,
      name: stockInfo.name,
      description: stockInfo.description,
      exchange: "NSE",
      industry: stockInfo.sector,
      sector: stockInfo.sector,
      marketCap: stockInfo.marketCap,
      peRatio: stockInfo.peRatio,
      eps: stockInfo.eps,
      dividend: stockInfo.dividend,
      targetPrice: parseFloat((Math.random() * 20 + 110).toFixed(2)),
    };
  } else if (isIndianStock) {
    // For other Indian stocks not in our predefined list
    const marketCap = `₹${(Math.random() * 5000 + 100).toFixed(2)} Cr`;
    const peRatio = parseFloat((Math.random() * 50 + 5).toFixed(2));
    const eps = parseFloat((Math.random() * 50 + 5).toFixed(2));
    const dividend = parseFloat((Math.random() * 5).toFixed(2));
    
    return {
      symbol: symbol,
      name: `${stockCode} Ltd.`,
      description: `${stockCode} is a leading Indian company in its sector.`,
      exchange: "NSE",
      industry: "Indian Equity",
      sector: "Indian Equity",
      marketCap: marketCap,
      peRatio: peRatio,
      eps: eps,
      dividend: dividend,
      targetPrice: parseFloat((Math.random() * 100 + 50).toFixed(2)),
    };
  } else {
    // For US stocks
    const marketCap = `$${(Math.random() * 1000 + 10).toFixed(2)}B`;
    const peRatio = parseFloat((Math.random() * 50 + 5).toFixed(2));
    const eps = parseFloat((Math.random() * 10).toFixed(2));
    const dividend = parseFloat((Math.random() * 5).toFixed(2));
    
    // US companies data
    const usCompanies: Record<string, { name: string, sector: string, description: string }> = {
      "AAPL": { 
        name: "Apple Inc.", 
        sector: "Technology",
        description: "Apple Inc. is an American multinational technology company that designs, develops, and sells consumer electronics, computer software, and online services."
      },
      "MSFT": { 
        name: "Microsoft Corporation", 
        sector: "Technology",
        description: "Microsoft Corporation is an American multinational technology corporation that produces computer software, consumer electronics, personal computers, and related services."
      },
      "GOOGL": { 
        name: "Alphabet Inc.", 
        sector: "Technology",
        description: "Alphabet Inc. is an American multinational technology conglomerate holding company headquartered in Mountain View, California. It was created through a restructuring of Google in 2015."
      },
      "AMZN": { 
        name: "Amazon.com Inc.", 
        sector: "Consumer Discretionary",
        description: "Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence."
      },
      "META": { 
        name: "Meta Platforms Inc.", 
        sector: "Technology",
        description: "Meta Platforms, Inc., formerly known as Facebook, Inc., is an American multinational technology conglomerate that owns Facebook, Instagram, and WhatsApp, among other products and services."
      }
    };
    
    const companyInfo = usCompanies[symbol] || { 
      name: `${symbol} Corporation`, 
      sector: "US Equity",
      description: `${symbol} is a leading US company in its sector.`
    };
    
    return {
      symbol: symbol,
      name: companyInfo.name,
      description: companyInfo.description,
      exchange: "NASDAQ/NYSE",
      industry: companyInfo.sector,
      sector: companyInfo.sector,
      marketCap: marketCap,
      peRatio: peRatio,
      eps: eps,
      dividend: dividend,
      targetPrice: parseFloat((Math.random() * 100 + 50).toFixed(2)),
    };
  }
};

// Generate mock chart data
const generateMockChartData = (symbol: string) => {
  const isIndianStock = symbol.startsWith('NSE:');
  const stockCode = symbol.replace('NSE:', '');
  
  // Base prices for popular Indian stocks
  const indianStockPrices: Record<string, number> = {
    "RELIANCE": 2934.75,
    "TCS": 3876.20,
    "HDFCBANK": 1678.55,
    "INFY": 1456.90,
    "ICICIBANK": 1023.45,
    "BHARTIARTL": 1189.30,
    "HINDUNILVR": 2456.75,
    "SBIN": 745.60,
    "WIPRO": 478.90,
    "LT": 3245.80,
    "NIFTY": 22345.60,
    "BANKNIFTY": 48234.75,
    "SENSEX": 73456.80,
    "NIFTYIT": 32567.90
  };
  
  const data = [];
  const dataPoints = 100;
  
  // Set initial price based on stock or default
  let currentPrice = 100;
  if (isIndianStock && indianStockPrices[stockCode]) {
    currentPrice = indianStockPrices[stockCode];
  } else if (isIndianStock) {
    currentPrice = 1000 + (Math.random() * 2000);
  }
  
  // Generate volatility factor based on stock type
  const volatilityFactor = isIndianStock ? 
    (indianStockPrices[stockCode] ? currentPrice * 0.005 : currentPrice * 0.01) : // 0.5% for known Indian stocks, 1% for unknown
    currentPrice * 0.02; // 2% for US stocks
  
  // Generate trend direction (up, down, sideways)
  const trendDirection = Math.random() > 0.5 ? 1 : -1;
  const trendStrength = Math.random() * 0.3; // 0-0.3% trend per day
  
  for (let i = 0; i < dataPoints; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (dataPoints - i));
    
    // Add trend component
    const trendComponent = currentPrice * trendStrength * trendDirection;
    
    // Add random component (volatility)
    const randomComponent = (Math.random() * volatilityFactor * 2) - volatilityFactor;
    
    // Update price with trend and randomness
    currentPrice = currentPrice + trendComponent + randomComponent;
    
    // Ensure price doesn't go negative
    if (currentPrice < 1) currentPrice = 1;
    
    data.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      value: parseFloat(currentPrice.toFixed(2)),
    });
  }
  
  return data;
};

// Generate mock news
const generateMockNews = (symbol: string = '') => {
  const companyName = symbol 
    ? ({"AAPL": "Apple", "MSFT": "Microsoft", "GOOGL": "Google", "AMZN": "Amazon", "META": "Meta", "TSLA": "Tesla"}[symbol] || symbol) 
    : 'Market';
  
  const headlines = [
    {
      title: `${companyName} Exceeds Quarterly Expectations`,
      source: "Market Watch",
      time: "2 hours ago",
      sentiment: "positive",
    },
    {
      title: `Analysts Raise Price Target for ${symbol || 'Top Stocks'}`,
      source: "Bloomberg",
      time: "5 hours ago",
      sentiment: "positive",
    },
    {
      title: `${companyName} Announces New Product Line`,
      source: "CNBC",
      time: "1 day ago",
      sentiment: "positive",
    },
    {
      title: `${companyName} Faces Supply Chain Challenges`,
      source: "Reuters",
      time: "12 hours ago",
      sentiment: "negative",
    },
    {
      title: `Industry Shift Could Impact ${companyName}`,
      source: "Financial Times",
      time: "3 days ago",
      sentiment: "neutral",
    },
    {
      title: `${companyName} Expands into New Markets`,
      source: "The Wall Street Journal",
      time: "2 days ago",
      sentiment: "positive",
    },
    {
      title: `${companyName} CEO Addresses Investor Concerns`,
      source: "Yahoo Finance",
      time: "4 hours ago",
      sentiment: "neutral",
    },
    {
      title: `${symbol || 'Market'} Dips Following Regulatory Announcement`,
      source: "Seeking Alpha",
      time: "7 hours ago",
      sentiment: "negative",
    },
  ];
  
  // Shuffle and take a random number of headlines (3-5)
  const shuffled = [...headlines].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 3);
};

/**
 * Search for stocks using Alpha Vantage API or Breeze API
 */
export const searchStocks = async (query: string) => {
  try {
    // Try to get data from Breeze API first if available
    if (breezeUtils.isBreezeAPIAvailable()) {
      const breezeData = await breezeUtils.searchStocks(query);
      if (breezeData && breezeData.length > 0) {
        toast.success(`Found ${breezeData.length} stocks matching "${query}" from Breeze API`);
        return breezeData;
      }
    }
    
    // If Breeze API is not available or returns no data, fall back to Alpha Vantage
    // Check if we should use mock data due to API limits
    if (shouldUseMockData()) {
      toast.info(`Using cached search results (API limit reached)`);
      return getMockSearchResults(query, true);
    }
    
    // Check if we should search for Indian stocks specifically
    const isIndianQuery = query.toLowerCase().includes('nse:') || 
                         query.toLowerCase().includes('india') ||
                         query.toLowerCase().includes('nifty') ||
                         query.toLowerCase().includes('sensex');
    
    // If it's an Indian query, remove the NSE: prefix for the API call
    const apiQuery = isIndianQuery && query.toLowerCase().startsWith('nse:') 
      ? query.substring(4) 
      : query;
    
    console.log(`Searching for stocks with query: ${query} (API query: ${apiQuery})`);
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${apiQuery}&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    console.log("Search API response:", data);

    let results = [];
    
    if (data.bestMatches && data.bestMatches.length > 0) {
      results = data.bestMatches.map((match: any) => {
        // Add NSE: prefix for Indian stocks
        const isIndianStock = match['4. region'] === 'India' && match['8. currency'] === 'INR';
        const symbol = isIndianStock ? `NSE:${match['1. symbol'].replace('.NS', '')}` : match['1. symbol'];
        
        return {
          symbol: symbol,
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          marketOpen: match['5. marketOpen'],
          marketClose: match['6. marketClose'],
          timezone: match['7. timezone'],
          currency: match['8. currency'],
          matchScore: match['9. matchScore']
        };
      });
      
      // Filter to only show Indian stocks if requested
      if (isIndianQuery) {
        results = results.filter(stock => stock.region === 'India' || stock.symbol.startsWith('NSE:'));
      }
      
      toast.success(`Found ${results.length} stocks matching "${query}"`);
    } else if (data.Note && data.Note.includes("API call frequency")) {
      // API limit reached
      console.warn("API call frequency exceeded:", data.Note);
      toast.warning("API limit reached for search. Using cached results temporarily.");
      
      // Return mock results for Indian stocks
      return getMockSearchResults(query, isIndianQuery);
    } else {
      // If no results or API limit reached, add some common Indian stocks
      console.warn("No search results found for", query, "API response:", data);
      toast.info(`No stocks found matching "${query}". Showing suggested stocks.`);
      
      return getMockSearchResults(query, isIndianQuery);
    }

    return results;
  } catch (error) {
    console.error("Error searching stocks:", error);
    toast.error(`Failed to search for "${query}". Showing suggested stocks.`);
    
    // Return mock results
    return getMockSearchResults(query, true);
  }
};

// Helper function to get mock search results
const getMockSearchResults = (query: string, isIndianQuery: boolean = true) => {
  const indianStockKeywords = [
    'reliance', 'tata', 'infosys', 'hdfc', 'nifty', 'sensex', 'bajaj', 
    'icici', 'sbi', 'axis', 'airtel', 'wipro', 'hcl', 'adani', 'mahindra'
  ];
  
  // Check if query matches any Indian stock keywords
  const matchesIndianKeyword = indianStockKeywords.some(keyword => 
    query.toLowerCase().includes(keyword) || keyword.includes(query.toLowerCase())
  );
  
  if (matchesIndianKeyword || isIndianQuery || query.trim().length < 3) {
    const mockIndianStocks = [
      { symbol: 'NSE:RELIANCE', name: 'Reliance Industries Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:TCS', name: 'Tata Consultancy Services Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:INFY', name: 'Infosys Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:HDFCBANK', name: 'HDFC Bank Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:ICICIBANK', name: 'ICICI Bank Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:SBIN', name: 'State Bank of India', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:BHARTIARTL', name: 'Bharti Airtel Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:WIPRO', name: 'Wipro Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:HCLTECH', name: 'HCL Technologies Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:LT', name: 'Larsen & Toubro Ltd', region: 'India', currency: 'INR', type: 'Equity' },
      { symbol: 'NSE:NIFTY', name: 'NIFTY 50 Index', region: 'India', currency: 'INR', type: 'Index' },
      { symbol: 'NSE:BANKNIFTY', name: 'Bank NIFTY Index', region: 'India', currency: 'INR', type: 'Index' },
      { symbol: 'NSE:SENSEX', name: 'S&P BSE SENSEX Index', region: 'India', currency: 'INR', type: 'Index' },
      { symbol: 'NSE:BAJFINANCE', name: 'Bajaj Finance Ltd', region: 'India', currency: 'INR', type: 'Equity' }
    ];
    
    // Filter mock stocks based on query
    return mockIndianStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
      stock.name.toLowerCase().includes(query.toLowerCase()) ||
      query.trim().length < 3 // Show all if query is very short
    );
  }
  
  // For non-Indian queries, return some default stocks
  return [
    { symbol: 'AAPL', name: 'Apple Inc', region: 'United States', currency: 'USD', type: 'Equity' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', region: 'United States', currency: 'USD', type: 'Equity' },
    { symbol: 'GOOGL', name: 'Alphabet Inc', region: 'United States', currency: 'USD', type: 'Equity' },
    { symbol: 'AMZN', name: 'Amazon.com Inc', region: 'United States', currency: 'USD', type: 'Equity' },
    { symbol: 'META', name: 'Meta Platforms Inc', region: 'United States', currency: 'USD', type: 'Equity' }
  ];
};
