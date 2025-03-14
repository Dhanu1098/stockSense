
// Format large numbers for better readability
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toString();
};

// Calculate the AI recommendation based on various factors
export const getAIRecommendation = (
  priceChangePercent: number,
  peRatio: number,
  volume: number,
  avgVolume: number
): { recommendation: "Buy" | "Sell" | "Hold"; confidence: number; reasons: string[] } => {
  // This is a very simplified recommendation algorithm
  // In a real app, you would use more sophisticated analysis
  
  const reasons: string[] = [];
  let score = 50; // Neutral starting point
  
  // Factor 1: Price momentum
  if (priceChangePercent > 2) {
    score += 15;
    reasons.push("Strong positive price momentum");
  } else if (priceChangePercent > 0.5) {
    score += 7;
    reasons.push("Positive price trend");
  } else if (priceChangePercent < -2) {
    score -= 15;
    reasons.push("Significant price decline");
  } else if (priceChangePercent < -0.5) {
    score -= 7;
    reasons.push("Negative price trend");
  }
  
  // Factor 2: P/E ratio evaluation
  if (peRatio < 15) {
    score += 10;
    reasons.push("Attractive P/E ratio indicates potential value");
  } else if (peRatio > 30) {
    score -= 10;
    reasons.push("High P/E ratio may indicate overvaluation");
  }
  
  // Factor 3: Volume analysis
  const volumeRatio = volume / avgVolume;
  if (volumeRatio > 1.5 && priceChangePercent > 0) {
    score += 12;
    reasons.push("High volume supporting price increase");
  } else if (volumeRatio > 1.5 && priceChangePercent < 0) {
    score -= 12;
    reasons.push("High volume driving price down");
  }
  
  // Determine recommendation based on score
  let recommendation: "Buy" | "Sell" | "Hold";
  if (score >= 65) {
    recommendation = "Buy";
  } else if (score <= 35) {
    recommendation = "Sell";
  } else {
    recommendation = "Hold";
  }
  
  // Calculate confidence level (0-100)
  const confidence = Math.min(100, Math.max(0, Math.abs(score - 50) * 2));
  
  return {
    recommendation,
    confidence,
    reasons: reasons.slice(0, 3), // Limit to top 3 reasons
  };
};

// Generate mock news for a stock
export const generateMockNews = (symbol: string, companyName: string) => {
  const headlines = [
    {
      title: `${companyName} Exceeds Quarterly Expectations`,
      source: "Market Watch",
      time: "2 hours ago",
      sentiment: "positive",
    },
    {
      title: `Analysts Raise Price Target for ${symbol}`,
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
      title: `${symbol} Stock Dips Following Regulatory Announcement`,
      source: "Seeking Alpha",
      time: "7 hours ago",
      sentiment: "negative",
    },
  ];
  
  // Shuffle and take a random number of headlines (3-5)
  const shuffled = [...headlines].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 3);
};

// Generate mock technical indicators
export const generateTechnicalIndicators = (price: number, changePercent: number) => {
  // This is a simplified version - in a real app, you would calculate these properly
  const movingAverages = {
    "MA50": price * (1 + (Math.random() * 0.1 - 0.05)),
    "MA100": price * (1 + (Math.random() * 0.15 - 0.075)),
    "MA200": price * (1 + (Math.random() * 0.2 - 0.1)),
  };
  
  const indicators = {
    "RSI": Math.min(95, Math.max(5, 50 + changePercent * 5 + (Math.random() * 20 - 10))),
    "MACD": changePercent * 0.2 + (Math.random() * 0.4 - 0.2),
    "Signal": changePercent * 0.15 + (Math.random() * 0.3 - 0.15),
    "Histogram": changePercent * 0.05 + (Math.random() * 0.2 - 0.1),
    "Bollinger Upper": price * (1 + 0.02 + Math.random() * 0.01),
    "Bollinger Lower": price * (1 - 0.02 - Math.random() * 0.01),
  };
  
  return {
    movingAverages,
    indicators,
  };
};

// Generate market sentiment analysis
export const getMarketSentiment = () => {
  // Generate random sentiment values
  const overall = Math.random() * 100;
  const shortTerm = Math.random() > 0.5 ? 1 : -1;
  const longTerm = Math.random() > 0.5 ? 1 : -1;
  
  // Generate market analysis text
  let analysis = '';
  
  if (overall > 60) {
    analysis = 'The market is showing bullish sentiment with strong buying interest across most sectors. Technical indicators suggest continued upward momentum in the near term. Investors appear optimistic about economic growth prospects.';
  } else if (overall < 40) {
    analysis = 'Market sentiment is bearish with selling pressure observed across major indices. Risk aversion has increased, and investors are showing caution. Technical indicators suggest a continuation of the downward trend in the short term.';
  } else {
    analysis = 'Market sentiment is mixed with no clear direction. While some sectors show strength, others face selling pressure. Investors are cautious and waiting for clearer signals before making significant moves.';
  }
  
  return {
    overall,
    shortTerm,
    longTerm,
    analysis
  };
};
