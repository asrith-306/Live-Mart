import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Menu,
  X,
  Home,
  Package,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";

interface NavigationProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navigation = ({
  isLoggedIn,
  onLogout
}: NavigationProps) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-primary backdrop-blur-lg border-b border-primary-glow shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all duration-300">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Live Mart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              to="/dashboard" 
              className="text-white hover:text-white/80 transition-colors font-medium"
            >
              Products
            </Link>

            {/* Show Login and Sign Up when NOT logged in */}
            {!isLoggedIn && (
              <>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-bold"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Show Logout when logged in */}
            {isLoggedIn && (
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="bg-red-500 hover:bg-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-primary/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left text-white"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </Link>

            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left text-white"
            >
              <Package className="h-5 w-5" />
              <span className="font-medium">Products</span>
            </Link>

            {/* Show Login and Sign Up when NOT logged in */}
            {!isLoggedIn && (
              <div className="pt-2 space-y-2 border-t border-white/10">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 border-2 border-white text-white hover:bg-white/10"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    className="w-full justify-start gap-3 bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-bold"
                  >
                    <UserPlus className="h-5 w-5" />
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Show Logout when logged in */}
            {isLoggedIn && (
              <div className="pt-2 border-t border-white/10">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full justify-start gap-3 bg-red-500 hover:bg-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;