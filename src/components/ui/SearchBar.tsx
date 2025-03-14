import React, { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { searchStocks } from "@/utils/apiUtils";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

interface StockSuggestion {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search for a stock symbol or company",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSelect = (symbol: string) => {
    setQuery(symbol);
    onSearch(symbol);
    setIsFocused(false);
    setSuggestions([]);
  };

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchStocks(query.trim());
        setSuggestions(results);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="h-12 pl-12 pr-12 text-lg"
          disabled={isLoading}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-12 top-1/2 -translate-y-1/2 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="size-5 text-muted-foreground" />
          </Button>
        )}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          disabled={!query.trim() || isLoading}
        >
          <Search className="size-5" />
        </Button>
      </form>

      {isFocused && (suggestions.length > 0 || isSearching) && (
        <div className="absolute z-10 mt-2 w-full rounded-xl glass border border-border shadow-lg animate-fade-in">
          <div className="p-4">
            {isSearching ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <>
                <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  स्टॉक सुझाव
                </h3>
                <ul className="space-y-1">
                  {suggestions.map((stock) => (
                    <li
                      key={stock.symbol}
                      onClick={() => handleSelect(stock.symbol)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stock.symbol.replace('NSE:', '')}</span>
                        <span className="text-sm text-muted-foreground">—</span>
                        <span className="text-sm text-muted-foreground">{stock.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stock.region}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
