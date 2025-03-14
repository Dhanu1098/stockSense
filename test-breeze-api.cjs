// Simple script to test Breeze API
const BreezeConnect = require('breezeconnect').BreezeConnect;
const https = require('https');
const querystring = require('querystring');

// API credentials
const API_KEY = "c9Yz006y5110r4P322463f$9p30=85E3";
const API_SECRET = "52vO04i_428+F23w53%$48019hC2g822";
const SESSION_TOKEN = "50885197"; // Updated session token

// Function to get customer details and session token
function getCustomerDetails(apiKey, apiSession) {
  return new Promise((resolve, reject) => {
    // Encode API key for URL
    const encodedApiKey = encodeURIComponent(apiKey);
    
    // URL for customer details API
    const loginUrl = `https://api.icicidirect.com/apiuser/login?api_key=${encodedApiKey}`;
    
    console.log(`Login URL: ${loginUrl}`);
    console.log("Please visit this URL in your browser, login with your ICICI Direct credentials, and get the API_Session value from the response.");
    console.log("After login, you'll be redirected to your redirect URL. Check the network tab in developer tools for the API_Session value.");
    
    resolve("Please follow the instructions above to get a valid session token.");
  });
}

// Initialize Breeze API client
const breeze = new BreezeConnect({
  appKey: API_KEY
});

// Test function
async function testBreezeAPI() {
  try {
    console.log("Initializing Breeze API...");
    console.log("API Key:", API_KEY);
    console.log("API Secret:", API_SECRET);
    
    // Try to generate session with the provided token
    console.log("Attempting to generate session with provided token...");
    try {
      await breeze.generateSession(API_SECRET, SESSION_TOKEN);
      console.log("Session generated successfully");
      
      // Define stocks with their ICICI stock codes (based on the previous response)
      const stocks = [
        { name: "RELIANCE", code: "RELIND", exchange: "NSE" },
        { name: "TCS", code: "TCS", exchange: "NSE" },
        { name: "HDFC Bank", code: "HDFBAN", exchange: "NSE" },
        { name: "Infosys", code: "INFTEC", exchange: "NSE" }
      ];
      
      for (const stock of stocks) {
        try {
          console.log(`\nTesting getQuotes for ${stock.name} with ICICI code ${stock.code}...`);
          const quoteResponse = await breeze.getQuotes({
            stockCode: stock.code,
            exchangeCode: stock.exchange,
            productType: "cash",
            expiryDate: "",
            right: "",
            strikePrice: ""
          });
          
          console.log(`Quote response for ${stock.name}:`, JSON.stringify(quoteResponse, null, 2));
          
          if (quoteResponse && quoteResponse.Success) {
            console.log(`Successfully received data for ${stock.name}`);
            console.log("Stock price:", quoteResponse.Success[0].ltp);
            console.log("Change %:", quoteResponse.Success[0].ltp_percent_change);
          } else {
            console.log(`No quote data available for ${stock.name}`);
          }
        } catch (stockError) {
          console.error(`Error fetching data for ${stock.name}:`, stockError.message);
        }
      }
      
      // Try to get margin information
      console.log("\nGetting margin information...");
      try {
        const marginResponse = await breeze.getMargin("NSE");
        console.log("Margin response:", JSON.stringify(marginResponse, null, 2));
      } catch (marginError) {
        console.error("Error getting margin:", marginError.message);
      }
      
      // Try to get portfolio positions
      console.log("\nGetting portfolio positions...");
      try {
        const positionsResponse = await breeze.getPortfolioPositions();
        console.log("Positions response:", JSON.stringify(positionsResponse, null, 2));
      } catch (positionsError) {
        console.error("Error getting positions:", positionsError.message);
      }
      
    } catch (sessionError) {
      console.error("Error generating session:", sessionError);
      console.log("The session token might be expired or invalid.");
      
      // Get customer details and session token
      const customerDetailsResult = await getCustomerDetails(API_KEY, SESSION_TOKEN);
      console.log(customerDetailsResult);
    }
  } catch (error) {
    console.error("Error testing Breeze API:", error);
  }
}

// Run the test
testBreezeAPI(); 