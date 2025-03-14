import { toast } from "sonner";

// Breeze API configuration
const BREEZE_API_KEY = import.meta.env.VITE_BREEZE_API_KEY || "";
const BREEZE_API_SECRET = import.meta.env.VITE_BREEZE_API_SECRET || "";
const BREEZE_SESSION_TOKEN = import.meta.env.VITE_BREEZE_SESSION_TOKEN || "";

// Check if Breeze API credentials are available
const isBreezeConfigured = BREEZE_API_KEY && BREEZE_API_SECRET && BREEZE_SESSION_TOKEN;

// Initialize Breeze API client
let breezeClient: any = null;
let BreezeConnect: any = null;

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
    
    // Create a script element to load breezeconnect as a global variable
    // This is a workaround for the 'require is not defined' error in Vite
    return new Promise<boolean>((resolve) => {
      // Check if we already have the BreezeConnect global
      if (window.BreezeConnect) {
        console.log("BreezeConnect already loaded globally");
        BreezeConnect = window.BreezeConnect;
        initializeClient(resolve);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/breezeconnect@1.0.29/dist/breezeconnect.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log("BreezeConnect script loaded successfully");
        // Access the global BreezeConnect object
        if (window.BreezeConnect) {
          BreezeConnect = window.BreezeConnect;
          initializeClient(resolve);
        } else {
          console.error("BreezeConnect not found in window after script load");
          resolve(false);
        }
      };
      
      script.onerror = (error) => {
        console.error("Failed to load BreezeConnect script:", error);
        resolve(false);
      };
      
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error("Failed to initialize Breeze API:", error);
    toast.error("Failed to connect to Breeze API. Using estimated values.");
    return false;
  }
};

// Helper function to initialize the Breeze client
const initializeClient = async (resolve: (value: boolean) => void) => {
  try {
    if (!BreezeConnect) {
      console.error("BreezeConnect is not available");
      resolve(false);
      return;
    }
    
    console.log("Initializing Breeze client with API key...");
    
    // Initialize the client with the API key
    breezeClient = new BreezeConnect({
      api_key: BREEZE_API_KEY
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
        stockCode: "RELIANCE",
        exchangeCode: "NSE",
        productType: "cash"
      });
      
      console.log("Test API call response:", JSON.stringify(testResponse, null, 2));
      
      if (testResponse && testResponse.Success) {
        toast.success("Connected to Breeze API for real-time Indian stock market data");
        resolve(true);
      } else {
        console.warn("Test API call did not return expected data:", testResponse);
        toast.warning("Connected to Breeze API but test call failed. Using mock data.");
        resolve(false);
      }
    } catch (testError) {
      console.error("Test API call failed:", testError);
      toast.error("Failed to test Breeze API connection. Using estimated values.");
      resolve(false);
    }
  } catch (error) {
    console.error("Failed to initialize Breeze client:", error);
    toast.error("Failed to connect to Breeze API. Using estimated values.");
    resolve(false);
  }
};

// Add BreezeConnect to the window type
declare global {
  interface Window {
    BreezeConnect: any;
  }
}

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
    const stockCode = symbol.replace('NSE:', '');
    
    console.log(`Fetching stock quote for ${stockCode} from Breeze API...`);
    
    // Get quotes from Breeze API
    const response = await breezeClient.getQuotes({
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    console.log(`Breeze API raw response for ${stockCode}:`, JSON.stringify(response, null, 2));
    
    if (response && response.Success) {
      const data = response.Success;
      console.log(`Successfully received data for ${stockCode}:`, data);
      
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
    const stockCode = symbol.replace('NSE:', '');
    
    console.log(`Fetching company overview for ${stockCode} from Breeze API...`);
    
    // Get names from Breeze API to get company details
    const response = await breezeClient.getNames({
      stockCode: stockCode,
      exchangeCode: "NSE"
    });
    
    console.log(`Breeze API names response for ${stockCode}:`, JSON.stringify(response, null, 2));
    
    if (response && response.Success) {
      const data = response.Success;
      console.log(`Successfully received company data for ${stockCode}:`, data);
      
      // Get quotes for additional data
      const quotesResponse = await breezeClient.getQuotes({
        stockCode: stockCode,
        exchangeCode: "NSE",
        productType: "cash"
      });
      
      // Define a type for the quotes data to fix linter errors
      interface QuotesData {
        marketCap?: string;
        pe?: number;
        eps?: number;
        dividend?: number;
        targetPrice?: number;
        [key: string]: any;
      }
      
      let quotesData: QuotesData = {};
      if (quotesResponse && quotesResponse.Success) {
        quotesData = quotesResponse.Success as QuotesData;
      }
      
      return {
        symbol: `NSE:${stockCode}`,
        name: data.companyName || stockCode,
        description: data.description || `${stockCode} is a company listed on the National Stock Exchange of India.`,
        exchange: "NSE",
        industry: data.sector || "Indian Equity",
        sector: data.sector || "Indian Equity",
        marketCap: quotesData.marketCap ? `₹${quotesData.marketCap} Cr` : "N/A",
        peRatio: quotesData.pe || 0,
        eps: quotesData.eps || 0,
        dividend: quotesData.dividend || 0,
        targetPrice: quotesData.targetPrice || 0
      };
    } else {
      console.warn("No company data available from Breeze API for", symbol);
      console.log("Response structure:", response);
      return null;
    }
  } catch (error) {
    console.error("Error fetching company overview from Breeze API:", error);
    return null;
  }
};

/**
 * Get historical data from Breeze API
 * @param symbol Stock symbol (e.g., "NSE:RELIANCE")
 * @param interval Time interval (e.g., "1day")
 * @returns Historical data or null if not available
 */
export const getHistoricalData = async (symbol: string, interval = "1day") => {
  if (!breezeClient) {
    console.warn("Breeze API not initialized. Using mock data.");
    return null;
  }

  try {
    // For NSE stocks
    const stockCode = symbol.replace('NSE:', '');
    
    console.log(`Fetching historical data for ${stockCode} from Breeze API...`);
    
    // Calculate date range (last 100 days)
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 100);
    
    const toDateStr = toDate.toISOString();
    const fromDateStr = fromDate.toISOString();
    
    // Get historical data from Breeze API
    const response = await breezeClient.getHistoricalDatav2({
      interval: interval,
      fromDate: fromDateStr,
      toDate: toDateStr,
      stockCode: stockCode,
      exchangeCode: "NSE",
      productType: "cash"
    });
    
    console.log(`Breeze API historical data response for ${stockCode}:`, JSON.stringify(response, null, 2));
    
    if (response && response.Success) {
      const data = response.Success.candles;
      console.log(`Successfully received historical data for ${stockCode}:`, data);
      
      // Transform data to required format
      return data.map((candle: any) => {
        return {
          date: candle[0].split('T')[0], // Extract date part from ISO string
          value: parseFloat(candle[4]) // Close price
        };
      });
    } else {
      console.warn("No historical data available from Breeze API for", symbol);
      console.log("Response structure:", response);
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
    const stockCode = symbol.replace('NSE:', '');
    
    console.log(`Fetching company name for ${stockCode} from Breeze API...`);
    
    // Get names from Breeze API
    const response = await breezeClient.getNames({
      stockCode: stockCode,
      exchangeCode: "NSE"
    });
    
    if (response && response.Success) {
      const data = response.Success;
      return data.companyName || stockCode;
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
      { name: "NIFTY 50", code: "NIFTY" },
      { name: "Bank NIFTY", code: "BANKNIFTY" },
      { name: "NIFTY IT", code: "NIFTYIT" },
      { name: "SENSEX", code: "SENSEX" }
    ];
    
    const results = [];
    
    // Fetch data for each index
    for (const index of indices) {
      try {
        const response = await breezeClient.getQuotes({
          stockCode: index.code,
          exchangeCode: "NSE",
          productType: "cash"
        });
        
        if (response && response.Success) {
          const data = response.Success;
          
          results.push({
            name: index.name,
            value: parseFloat(data.lastRate),
            change: parseFloat(data.absoluteChange),
            changePercent: parseFloat(data.percentageChange),
            currency: "INR"
          });
        }
      } catch (indexError) {
        console.error(`Error fetching index ${index.name}:`, indexError);
      }
    }
    
    if (results.length > 0) {
      return results;
    } else {
      console.warn("No market indices available from Breeze API");
      return null;
    }
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