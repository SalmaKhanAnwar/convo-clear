import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, Menu } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ML</span>
            </div>
            <span className="text-xl font-bold font-display">MeetingLingo</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#use-cases" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Use Cases
            </a>
            <a href="#login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Log In
            </a>
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              <Globe className="w-4 h-4" />
              <span>EN</span>
              <ChevronDown className="w-3 h-3" />
            </div>

            {/* Product Hunt Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
              <span>🐱</span>
              <span>Product Hunt</span>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="btn-hero text-sm"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col space-y-4">
              <a href="#pricing" className="text-sm font-medium text-foreground">Pricing</a>
              <a href="#use-cases" className="text-sm font-medium text-foreground">Use Cases</a>
              <a href="#login" className="text-sm font-medium text-foreground">Log In</a>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="btn-hero text-sm w-full"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;