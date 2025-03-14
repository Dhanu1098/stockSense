import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { toast } from "sonner";
import { initializeBreezeAPI, getStockQuote } from "./utils/breezeUtils";

// Initialize theme from localStorage or system preference before rendering
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // If no theme is saved, check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }
};

// Initialize API
const initializeAPI = async () => {
  try {
    console.log("Attempting to initialize Breeze API...");
    
    // Try to initialize Breeze API first
    const breezeInitialized = await initializeBreezeAPI();
    
    if (breezeInitialized) {
      console.log("Breeze API initialized successfully, testing with stock quotes...");
      
      // Test with some popular Indian stocks
      // Using NSE symbols that will be mapped to ICICI stock codes in breezeUtils.ts
      const testStocks = ["NSE:RELIANCE", "NSE:TCS", "NSE:HDFCBANK", "NSE:INFY"];
      
      for (const stock of testStocks) {
        try {
          console.log(`Testing stock quote for ${stock}...`);
          const stockData = await getStockQuote(stock);
          console.log(`Stock data for ${stock}:`, stockData);
          
          if (stockData) {
            toast.success(`Successfully fetched real data for ${stock}`);
          } else {
            toast.warning(`Could not fetch real data for ${stock}, using mock data`);
          }
        } catch (stockError) {
          console.error(`Error fetching ${stock}:`, stockError);
        }
      }
    } else {
      // If Breeze API initialization failed, use mock data
      console.log("Using mock data for Indian stock market");
      toast.info("Using realistic mock data for Indian stocks.", {
        duration: 5000,
        position: "top-center",
      });
    }
  } catch (error) {
    console.error("Failed to initialize API:", error);
    toast.error("Failed to initialize API. Using mock data.");
  }
};

// Initialize theme and API
initializeTheme();
initializeAPI();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
