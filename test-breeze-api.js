// Simple script to test Breeze API
const BreezeConnect = require('breezeconnect').BreezeConnect;

// API credentials
const API_KEY = "604718T4!d32GMS6166W21P2Mupa1449";
const API_SECRET = "ax39y158575L189W10046N0GXWK1s060";
const SESSION_TOKEN = "50884624";

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
    console.log("Session Token:", SESSION_TOKEN);

    // Generate session
    console.log("Generating session...");
    await breeze.generateSession(API_SECRET, SESSION_TOKEN);
    console.log("Session generated successfully");

    // Test with a simple call to getQuotes
    console.log("Testing getQuotes for RELIANCE...");
    const response = await breeze.getQuotes({
      stockCode: "RELIANCE",
      exchangeCode: "NSE",
      productType: "cash"
    });

    console.log("API Response:", JSON.stringify(response, null, 2));

    if (response && response.Success) {
      console.log("Successfully received data for RELIANCE");
      console.log("Stock price:", response.Success.lastRate);
      console.log("Change:", response.Success.absoluteChange);
      console.log("Change %:", response.Success.percentageChange);
    } else {
      console.log("No data available from Breeze API");
    }
  } catch (error) {
    console.error("Error testing Breeze API:", error);
  }
}

// Run the test
testBreezeAPI(); 