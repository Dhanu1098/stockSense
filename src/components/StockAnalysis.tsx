// Find the fetchAIRecommendation function and update it to handle errors better
const fetchAIRecommendation = async (stockData: StockData) => {
  try {
    setAiLoading(true);
    const recommendation = await getAIRecommendation(stockData);
    setAiRecommendation(recommendation);
    setAiLoading(false);
  } catch (error) {
    console.error("Error fetching AI recommendation:", error);
    // Set a fallback recommendation
    setAiRecommendation({
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
    });
    setAiLoading(false);
  }
}; 