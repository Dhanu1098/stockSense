import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { toast } from "sonner";

// Initialize the Google Generative AI with your API key
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Define the StockData interface to match the one in useStockData.tsx
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  chartData: { date: string; value: number }[];
  marketCap: number;
  peRatio: number;
  eps: number;
  dividend: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  week52High: number;
  week52Low: number;
  currency: string;
}

// Define the AIRecommendation interface
export interface AIRecommendation {
  summary: string;
  recommendation: "Buy" | "Sell" | "Hold";
  confidenceScore: number;
  reasons: string[];
  riskLevel: "Low" | "Medium" | "High";
  shortTermOutlook: string;
  longTermOutlook: string;
}

/**
 * Get AI recommendation for a stock
 * @param stockData Stock data to analyze
 * @returns AI recommendation
 */
export const getAIRecommendation = async (stockData: StockData): Promise<AIRecommendation> => {
  try {
    // Use Gemini 2 Flash model instead of gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Configure safety settings
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    // Prepare the prompt with stock data
    const prompt = `
      You are a professional stock market analyst. Analyze the following stock data and provide a recommendation:
      
      Stock: ${stockData.name} (${stockData.symbol})
      Current Price: ${stockData.currency === 'INR' ? '₹' : '$'}${stockData.price}
      Change: ${stockData.change > 0 ? '+' : ''}${stockData.change} (${stockData.changePercent > 0 ? '+' : ''}${stockData.changePercent}%)
      Market Cap: ${stockData.currency === 'INR' ? '₹' : '$'}${(stockData.marketCap / 1000000000).toFixed(2)}B
      P/E Ratio: ${stockData.peRatio}
      EPS: ${stockData.eps}
      Dividend Yield: ${stockData.dividend}%
      52-Week Range: ${stockData.currency === 'INR' ? '₹' : '$'}${stockData.week52Low} - ${stockData.currency === 'INR' ? '₹' : '$'}${stockData.week52High}
      
      Provide your analysis in the following JSON format:
      {
        "summary": "A brief summary of the stock's current situation",
        "recommendation": "Buy, Sell, or Hold",
        "confidenceScore": "A number between 0 and 1",
        "reasons": ["Reason 1", "Reason 2", "Reason 3"],
        "riskLevel": "Low, Medium, or High",
        "shortTermOutlook": "Short-term outlook (1-3 months)",
        "longTermOutlook": "Long-term outlook (1-2 years)"
      }
      
      Only respond with the JSON, no other text.
    `;

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    const text = response.text();
    
    console.log("AI response:", text);
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from AI response");
    }
    
    const jsonStr = jsonMatch[0];
    const recommendation = JSON.parse(jsonStr) as AIRecommendation;
    
    return recommendation;
  } catch (error) {
    console.error("Error getting AI recommendation:", error);
    toast.error("Failed to get AI recommendation. Using fallback analysis.");
    
    // Return fallback recommendation
    return {
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
    };
  }
};

export const generateMarketInsights = async (marketData: any): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Analyze the following market data and provide insights:
      ${JSON.stringify(marketData, null, 2)}

      Please provide a brief market analysis focusing on:
      1. Overall market sentiment
      2. Key trends
      3. Notable sectors
      4. Potential market moving events
      
      Keep the response concise and actionable.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating market insights:", error);
    return "Unable to generate market insights at this time.";
  }
}; 