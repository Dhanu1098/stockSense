
import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, X, BarChart2, Search, BookUser, TrendingUp, LayoutDashboard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useMediaQuery } from "@/hooks/use-mobile";

const Header = () => {
  const { theme, setTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const menuItems = [
    { name: "Stock Analysis", icon: <Search className="h-4 w-4 mr-2" />, path: "/stock-analysis" },
    { name: "Market Trends", icon: <TrendingUp className="h-4 w-4 mr-2" />, path: "/market-trends" },
    { name: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 mr-2" />, path: "/dashboard" },
    { name: "AI Analysis", icon: <Sparkles className="h-4 w-4 mr-2" />, path: "/ai-analysis" },
  ];

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">StockSense</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center"
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Authentication buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link to="/signup">
                <BookUser className="h-4 w-4" />
                Sign Up
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && isMobile && (
        <div className="md:hidden p-4 border-t bg-background">
          <nav className="flex flex-col gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/signup">
                  <BookUser className="h-4 w-4 mr-2" />
                  Sign Up
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
