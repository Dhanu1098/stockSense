import { toast } from "sonner";

// Breeze API configuration
const BREEZE_API_KEY = import.meta.env.VITE_BREEZE_API_KEY || "";
const BREEZE_API_SECRET = import.meta.env.VITE_BREEZE_API_SECRET || "";
const BREEZE_SESSION_TOKEN = import.meta.env.VITE_BREEZE_SESSION_TOKEN || "";

// Log the actual values for debugging
console.log("BREEZE_API_KEY:", BREEZE_API_KEY);
console.log("BREEZE_API_SECRET:", BREEZE_API_SECRET);
console.log("BREEZE_SESSION_TOKEN:", BREEZE_SESSION_TOKEN);

// Check if Breeze API credentials are available
const isBreezeConfigured = BREEZE_API_KEY && BREEZE_API_SECRET && BREEZE_SESSION_TOKEN;

// Initialize Breeze API client
let breezeClient: any = null;
let BreezeConnect: any = null;

// ICICI stock code mapping for popular NSE stocks
const STOCK_CODE_MAPPING: Record<string, string> = {
  "RELIANCE": "RELIND",
  "TCS": "TCS",
  "HDFCBANK": "HDFBAN",
  "INFY": "INFTEC",
  "ICICIBANK": "ICIBAN",
  "BHARTIARTL": "BHAAIR",
  "HINDUNILVR": "HINLEV",
  "SBIN": "SBIINB",
  "WIPRO": "WIPLTD",
  "LT": "LARTOU"
};

// Flag to track if Breeze API is available
export const isBreezeAPIAvailable = () => {
  return breezeClient !== null;
};

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
    console.log("Using breezeconnect package...");
    
    // Check if BreezeConnect is available globally (loaded from CDN in index.html)
    if (window.BreezeConnect) {
      console.log("BreezeConnect found in global scope");
      BreezeConnect = window.BreezeConnect;
      
      // Initialize the client
      return await initializeClientDirectly();
    } else {
      console.error("BreezeConnect not found in global scope");
      toast.error("Failed to load BreezeConnect library. Using mock data.");
      return false;
    }
  } catch (error) {
    console.error("Failed to initialize Breeze API:", error);
    toast.error("Failed to connect to Breeze API. Using estimated values.");
    return false;
  }
};

// Direct initialization without Promise wrapper
const initializeClientDirectly = async (): Promise<boolean> => {
  try {
    if (!BreezeConnect) {
      console.error("BreezeConnect is not available");
      return false;
    }
    
    console.log("Initializing Breeze client with API key...");
    
    // Initialize the client with the API key
    breezeClient = new BreezeConnect({
      appKey: BREEZE_API_KEY
    });
    
    console.log("Generating session with API secret and session token...");
    console.log("Session token being used:", BREEZE_SESSION_TOKEN);
    
    // Generate session using the session token
    await breezeClient.generateSession(BREEZE_API_SECRET, BREEZE_SESSION_TOKEN);
    
    console.log("Breeze API initialized successfully");
    
    // Test the API with a simple call
    try {
      console.log("Testing API with a simple call to getQuotes...");
      const testResponse = await breezeClient.getQuotes({
        stockCode: "RELIND", // Use ICICI stock code for Reliance
        exchangeCode: "NSE",
        productType: "cash",
        expiryDate: "",
        right: "",
        strikePrice: ""
      });
      
      console.log("Test API call response:", JSON.stringify(testResponse, null, 2));
      
      if (testResponse && testResponse.Success) {
        toast.success("Connected to Breeze API for real-time Indian stock market data");
        return true;
      } else {
        console.warn("Test API call did not return expected data:", testResponse);
        toast.warning("Connected to Breeze API but test call failed. Using mock data.");
        return false;
      }
    } catch (testError) {
      console.error("Test API call failed:", testError);
      toast.error("Failed to test Breeze API connection. Using estimated values.");
      return false;
    }
  } catch (error) {
    console.error("Failed to initialize Breeze client:", error);
    toast.error("Failed to connect to Breeze API. Using estimated values.");
    return false;
  }
};

// Add BreezeConnect to the window type
declare global {
  interface Window {
    BreezeConnect: any;
  }
}

/**
 * Get ICICI stock code for a given NSE symbol
 * @param symbol NSE symbol (e.g., "RELIANCE")
 * @returns ICICI stock code or the original symbol if not found
 */
const getICICIStockCode = (symbol: string): string => {
  const nseSymbol = symbol.replace('NSE:', '');
  return STOCK_CODE_MAPPING[nseSymbol] || nseSymbol;
};

/**
 * Get stock quote from Breeze API
 * @param symbol Stock symbol (e.g., "NSE:RELIANCE")
 * @returns Stock quote data or null if not available
 */
export const getStockQuote = async (symbol: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const nseSymbol = symbol.replace('NSE:', '');
    const stockCode = getICICIStockCode(nseSymbol);
    
    console.log(`Fetching stock quote for ${nseSymbol} (ICICI code: ${stockCode}) from Breeze API...`);
    
    // Get quotes from Breeze API
    const response = await breezeClient.getQuotes({
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash",
      expiryDate: "",
      right: "",
      strikePrice: ""
    });
    
    console.log(`Breeze API raw response for ${stockCode}:`, JSON.stringify(response, null, 2));
    
    if (response && response.Success && response.Success.length > 0) {
      const data = response.Success[0];
      console.log(`Successfully received data for ${stockCode}:`, data);
      
      return {
        symbol: `NSE:${nseSymbol}`,
        name: nseSymbol,
        price: parseFloat(data.ltp) || 0,
        change: parseFloat(data.ltp) - parseFloat(data.previous_close) || 0,
        changePercent: parseFloat(data.ltp_percent_change) || 0,
        volume: parseInt(data.total_quantity_traded) || 0,
        high: parseFloat(data.high) || 0,
        low: parseFloat(data.low) || 0,
        open: parseFloat(data.open) || 0,
        previousClose: parseFloat(data.previous_close) || 0,
        marketCap: 0, // Not available in the response
        avgVolume: 0, // Not available in the response
        week52High: 0, // Not available in the response
        week52Low: 0, // Not available in the response
        currency: "INR"
      };
    } else {
      console.warn("No data available from Breeze API for", symbol);
      console.log("Response structure:", response);
      return null;
    }
  } catch (error) {
    console.error("Error fetching stock quote from Breeze API:", error);
    return null;
  }
};

/**
 * Get company overview from Breeze API
 * @param symbol Stock symbol (e.g., "NSE:RELIANCE")
 * @returns Company overview data or null if not available
 */
export const getCompanyOverview = async (symbol: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const nseSymbol = symbol.replace('NSE:', '');
    const stockCode = getICICIStockCode(nseSymbol);
    
    console.log(`Fetching company overview for ${nseSymbol} (ICICI code: ${stockCode}) from Breeze API...`);
    
    // Get names from Breeze API to get company details
    const response = await breezeClient.getNames({
      stockCode: nseSymbol,
      exchangeCode: "NSE"
    });
    
    console.log(`Breeze API names response for ${stockCode}:`, JSON.stringify(response, null, 2));
    
    // Get quotes for additional data
    const quotesResponse = await breezeClient.getQuotes({
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash",
      expiryDate: "",
      right: "",
      strikePrice: ""
    });
    
    console.log(`Breeze API quotes response for ${stockCode}:`, JSON.stringify(quotesResponse, null, 2));
    
    let companyName = nseSymbol;
    let sector = "Indian Equity";
    
    if (response && response.company_name) {
      companyName = response.company_name.replace(/"/g, '');
    }
    
    let quotesData = {};
    if (quotesResponse && quotesResponse.Success && quotesResponse.Success.length > 0) {
      quotesData = quotesResponse.Success[0];
    }
    
    return {
      symbol: `NSE:${nseSymbol}`,
      name: companyName,
      description: `${companyName} is a company listed on the National Stock Exchange of India.`,
      exchange: "NSE",
      industry: sector,
      sector: sector,
      marketCap: "N/A",
      peRatio: 0,
      dividendYield: 0,
      eps: 0,
      high52Week: quotesData && 'high' in quotesData ? quotesData.high : 0,
      low52Week: quotesData && 'low' in quotesData ? quotesData.low : 0,
      currency: "INR"
    };
  } catch (error) {
    console.error("Error fetching company overview from Breeze API:", error);
    return null;
  }
};

/**
 * Get historical data from Breeze API
 * @param symbol Stock symbol (e.g., "NSE:RELIANCE")
 * @param interval Data interval (e.g., "daily", "weekly", "monthly")
 * @returns Historical data or null if not available
 */
export const getHistoricalData = async (symbol: string, interval = 'daily') => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const nseSymbol = symbol.replace('NSE:', '');
    const stockCode = getICICIStockCode(nseSymbol);
    
    console.log(`Fetching historical data for ${nseSymbol} (ICICI code: ${stockCode}) from Breeze API...`);
    
    // Convert interval to Breeze API format
    let breezeInterval = "1day";
    if (interval === 'daily') breezeInterval = "1day";
    else if (interval === 'weekly') breezeInterval = "1week";
    else if (interval === 'monthly') breezeInterval = "1month";
    
    // Calculate date range (last 3 months)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 3);
    
    // Format dates for Breeze API
    const fromDateStr = fromDate.toISOString();
    const toDateStr = toDate.toISOString();
    
    // Get historical data from Breeze API
    const response = await breezeClient.getHistoricalDatav2({
      interval: breezeInterval,
      fromDate: fromDateStr,
      toDate: toDateStr,
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    console.log(`Breeze API historical data response for ${stockCode}:`, response);
    
    if (response && response.Success && response.Success.length > 0) {
      // Transform data to the format expected by the chart component
      return response.Success.map((item: any) => ({
        date: new Date(item.datetime).toISOString().split('T')[0],
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume)
      })).reverse(); // Reverse to get chronological order
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
 * Get company name from Breeze API
 * @param symbol Stock symbol (e.g., "NSE:RELIANCE")
 * @returns Company name or null if not available
 */
export const getCompanyName = async (symbol: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const nseSymbol = symbol.replace('NSE:', '');
    
    console.log(`Fetching company name for ${nseSymbol} from Breeze API...`);
    
    // Get names from Breeze API
    const response = await breezeClient.getNames({
      stockCode: nseSymbol,
      exchangeCode: "NSE"
    });
    
    console.log(`Breeze API names response for ${nseSymbol}:`, JSON.stringify(response, null, 2));
    
    if (response && response.company_name) {
      return response.company_name.replace(/"/g, '');
    } else {
      console.warn("No company name available from Breeze API for", symbol);
      return null;
    }
  } catch (error) {
    console.error("Error fetching company name from Breeze API:", error);
    return null;
  }
};

/**
 * Get market indices from Breeze API
 * @returns Market indices data or null if not available
 */
export const getMarketIndices = async () => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    console.log("Fetching market indices from Breeze API...");
    
    // Define indices to fetch
    const indices = [
      { name: "NIFTY 50", code: "NIFTY", exchange: "NSE" },
      { name: "Bank NIFTY", code: "BANKNIFTY", exchange: "NSE" },
      { name: "NIFTY IT", code: "NIFTYIT", exchange: "NSE" }
    ];
    
    const results = [];
    
    for (const index of indices) {
      try {
        // Get quotes for the index
        const response = await breezeClient.getQuotes({
          stockCode: index.code,
          exchangeCode: index.exchange,
          productType: "cash",
          expiryDate: "",
          right: "",
          strikePrice: ""
        });
        
        console.log(`Breeze API response for ${index.name}:`, JSON.stringify(response, null, 2));
        
        if (response && response.Success && response.Success.length > 0) {
          const data = response.Success[0];
          
          results.push({
            name: index.name,
            value: parseFloat(data.ltp) || 0,
            change: parseFloat(data.ltp) - parseFloat(data.previous_close) || 0,
            changePercent: parseFloat(data.ltp_percent_change) || 0,
            currency: "INR"
          });
        }
      } catch (indexError) {
        console.error(`Error fetching data for ${index.name}:`, indexError);
      }
    }
    
    return results.length > 0 ? results : null;
  } catch (error) {
    console.error("Error fetching market indices from Breeze API:", error);
    return null;
  }
};

/**
 * Search for stocks using Breeze API
 * @param query Search query
 * @returns Search results or null if not available
 */
export const searchStocks = async (query: string) => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    console.log(`Searching for stocks with query "${query}" using Breeze API...`);
    
    // Get names from Breeze API
    const response = await breezeClient.getNames({
      stockCode: query,
      exchangeCode: "NSE"
    });
    
    console.log(`Breeze API search response for "${query}":`, JSON.stringify(response, null, 2));
    
    if (response && response.Success) {
      // Transform data to required format
      return [{
        symbol: `NSE:${response.Success.code}`,
        name: response.Success.companyName || response.Success.code,
        region: "India",
        currency: "INR",
        type: "Equity"
      }];
    } else {
      console.warn(`No search results for "${query}" from Breeze API`);
      return null;
    }
  } catch (error) {
    console.error(`Error searching for "${query}" using Breeze API:`, error);
    return null;
  }
}; 