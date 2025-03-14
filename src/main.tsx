import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { toast } from "sonner";
import { initializeBreezeAPI } from "./utils/breezeUtils";

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
    // Try to initialize Breeze API first
    const breezeInitialized = await initializeBreezeAPI();
    
    if (!breezeInitialized) {
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
    <ThemeProvider defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
