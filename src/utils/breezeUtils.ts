import { toast } from "sonner";

// Breeze API configuration
const BREEZE_API_KEY = import.meta.env.VITE_BREEZE_API_KEY || "";
const BREEZE_API_SECRET = import.meta.env.VITE_BREEZE_API_SECRET || "";
const BREEZE_SESSION_TOKEN = import.meta.env.VITE_BREEZE_SESSION_TOKEN || "";

// Check if Breeze API credentials are available
const isBreezeConfigured = BREEZE_API_KEY && BREEZE_API_SECRET && BREEZE_SESSION_TOKEN;

// Initialize Breeze API client
let breezeClient: any = null;

/**
 * Initialize the Breeze API client
 * This should be called once when the application starts
 * 
 * To get a valid session token:
 * 1. Go to https://api.icicidirect.com/apiuser/login?api_key=YOUR_ENCODED_API_KEY
 *    (Encode your API key using encodeURIComponent or a URL encoder)
 * 2. Login with your ICICI Direct credentials
 * 3. After login, check the network tab in developer tools
 * 4. Find the request to your redirect URL and look for API_Session in the form data
 * 5. Use that value as your session token
 * 
 * Note: Session tokens expire at midnight or after 24 hours
 */
export const initializeBreezeAPI = async () => {
  console.log("Initializing Breeze API...");
  console.log("API Key configured:", !!BREEZE_API_KEY);
  console.log("API Secret configured:", !!BREEZE_API_SECRET);
  console.log("Session Token configured:", !!BREEZE_SESSION_TOKEN);
  
  if (!isBreezeConfigured) {
    console.warn("Breeze API credentials not configured. Using mock data instead.");
    return false;
  }

  try {
    console.log("Attempting to import breezeconnect package...");
    
    // Dynamically import the breezeconnect package
    const BreezeConnect = await import('breezeconnect').then((module) => {
      console.log("breezeconnect package imported successfully");
      return module.BreezeConnect;
    }).catch(error => {
      console.error("Failed to import breezeconnect:", error);
      throw new Error("Failed to import breezeconnect package. Make sure it's installed with 'npm install breezeconnect'");
    });
    
    console.log("Initializing Breeze client with API key...");
    
    // Initialize the client
    breezeClient = new BreezeConnect({
      api_key: BREEZE_API_KEY
    });
    
    console.log("Generating session with API secret and session token...");
    console.log("Session token being used:", BREEZE_SESSION_TOKEN);
    
    // Generate session using the session token
    await breezeClient.generateSession(BREEZE_API_SECRET, BREEZE_SESSION_TOKEN);
    
    console.log("Breeze API initialized successfully");
    toast.success("Connected to Breeze API for real-time Indian stock market data");
    return true;
  } catch (error) {
    console.error("Failed to initialize Breeze API:", error);
    toast.error("Failed to connect to Breeze API. Using estimated values.");
    return false;
  }
};

/**
 * Get stock quotes from Breeze API
 * @param symbol Stock symbol (e.g., "RELIANCE", "TCS")
 * @returns Stock quote data
 */
export const getStockQuote = async (symbol: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const stockCode = symbol.replace('NSE:', '');
    
    console.log(`Fetching stock quote for ${stockCode} from Breeze API...`);
    
    // Get quotes from Breeze API
    const response = await breezeClient.getQuotes({
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    console.log(`Breeze API response for ${stockCode}:`, response);
    
    if (response && response.Success) {
      const data = response.Success;
      
      return {
        symbol: `NSE:${stockCode}`,
        name: data.companyName || stockCode,
        price: parseFloat(data.lastRate),
        change: parseFloat(data.absoluteChange),
        changePercent: parseFloat(data.percentageChange),
        volume: parseInt(data.volume),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        open: parseFloat(data.open),
        previousClose: parseFloat(data.close),
        marketCap: parseFloat(data.marketCap) || 0,
        avgVolume: parseInt(data.averageVolume) || 0,
        week52High: parseFloat(data.high52Week) || 0,
        week52Low: parseFloat(data.low52Week) || 0,
        currency: "INR"
      };
    } else {
      console.warn("No data available from Breeze API for", symbol);
      return null;
    }
  } catch (error) {
    console.error("Error fetching stock quote from Breeze API:", error);
    return null;
  }
};

/**
 * Get historical data from Breeze API
 * @param symbol Stock symbol (e.g., "RELIANCE", "TCS")
 * @param interval Interval for data points (e.g., "1minute", "5minute", "1day")
 * @param fromDate Start date in ISO format
 * @param toDate End date in ISO format
 * @returns Historical data for charting
 */
export const getHistoricalData = async (
  symbol: string, 
  interval: string = "1day", 
  fromDate: string = "", 
  toDate: string = ""
) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const stockCode = symbol.replace('NSE:', '');
    
    // Set default dates if not provided
    if (!fromDate) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 months ago
      fromDate = startDate.toISOString().split('T')[0];
    }
    
    if (!toDate) {
      toDate = new Date().toISOString().split('T')[0];
    }
    
    // Map interval to Breeze API interval
    let breezeInterval = "1day";
    if (interval === "intraday" || interval === "5minute") {
      breezeInterval = "5minute";
    } else if (interval === "weekly") {
      breezeInterval = "1week";
    }
    
    // Get historical data from Breeze API
    const response = await breezeClient.getHistoricalData({
      interval: breezeInterval,
      fromDate: fromDate,
      toDate: toDate,
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    if (response && response.Success && response.Success.candles) {
      // Transform the data for our chart component
      return response.Success.candles.map((candle: any) => ({
        date: candle[0], // Date
        value: parseFloat(candle[4]) // Close price
      }));
    } else {
      console.warn("No historical data available from Breeze API for", symbol);
      return null;
    }
  } catch (error) {
    console.error("Error fetching historical data from Breeze API:", error);
    return null;
  }
};

/**
 * Get market indices from Breeze API
 * @returns Array of market indices
 */
export const getMarketIndices = async () => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // Define the indices we want to fetch
    const indices = [
      { code: "NIFTY", name: "NIFTY 50" },
      { code: "BANKNIFTY", name: "Bank NIFTY" },
      { code: "NIFTYIT", name: "NIFTY IT" },
      { code: "SENSEX", name: "SENSEX" }
    ];
    
    // Fetch data for each index
    const promises = indices.map(async (index) => {
      try {
        const response = await breezeClient.getQuotes({
          stockCode: index.code,
          exchangeCode: "NSE",
          productType: "cash"
        });
        
        if (response && response.Success) {
          const data = response.Success;
          
          return {
            name: index.name,
            value: parseFloat(data.lastRate),
            change: parseFloat(data.absoluteChange),
            changePercent: parseFloat(data.percentageChange),
            currency: "INR",
            isMock: false
          };
        } else {
          console.warn(`No data available for ${index.name}`);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching ${index.name}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    return results.filter(result => result !== null);
  } catch (error) {
    console.error("Error fetching market indices from Breeze API:", error);
    return null;
  }
};

/**
 * Search for stocks using Breeze API
 * @param query Search query
 * @returns Array of matching stocks
 */
export const searchStocks = async (query: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // Use the getNames function to search for stocks
    const response = await breezeClient.getNames({
      exchange: "NSE",
      searchString: query
    });
    
    if (response && response.Success) {
      return response.Success.map((stock: any) => ({
        symbol: `NSE:${stock.code}`,
        name: stock.name,
        type: "Equity",
        region: "India",
        currency: "INR"
      }));
    } else {
      console.warn("No search results from Breeze API for", query);
      return null;
    }
  } catch (error) {
    console.error("Error searching stocks with Breeze API:", error);
    return null;
  }
};

/**
 * Get company overview from Breeze API
 * @param symbol Stock symbol
 * @returns Company overview data
 */
export const getCompanyOverview = async (symbol: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const stockCode = symbol.replace('NSE:', '');
    
    // Get quotes from Breeze API for basic information
    const response = await breezeClient.getQuotes({
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    if (response && response.Success) {
      const data = response.Success;
      
      // Breeze API doesn't provide detailed company information
      // We'll return what we can and supplement with mock data
      return {
        symbol: symbol,
        name: data.companyName || stockCode,
        exchange: "NSE",
        industry: "Indian Equity", // Not provided by Breeze
        sector: "Indian Equity", // Not provided by Breeze
        marketCap: data.marketCap || "N/A",
        peRatio: parseFloat(data.pe) || 0,
        eps: 0, // Not provided by Breeze
        dividend: 0, // Not provided by Breeze
        description: `${data.companyName || stockCode} is a company listed on the National Stock Exchange of India.`
      };
    } else {
      console.warn("No company data available from Breeze API for", symbol);
      return null;
    }
  } catch (error) {
    console.error("Error fetching company overview from Breeze API:", error);
    return null;
  }
};

/**
 * Get company name from Breeze API
 * @param symbol Stock symbol
 * @returns Company name
 */
export const getCompanyName = async (symbol: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const stockCode = symbol.replace('NSE:', '');
    
    // Get quotes from Breeze API for basic information
    const response = await breezeClient.getQuotes({
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    if (response && response.Success) {
      return response.Success.companyName || null;
    } else {
      console.warn("No company name available from Breeze API for", symbol);
      return null;
    }
  } catch (error) {
    console.error("Error fetching company name from Breeze API:", error);
    return null;
  }
};

// Export a function to check if Breeze API is available
export const isBreezeAPIAvailable = () => {
  return breezeClient !== null;
}; 