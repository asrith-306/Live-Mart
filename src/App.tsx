// src/App.tsx - Updated with new color scheme and dark mode
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient";
import Signup from "./Signup";
import Login from "./login";
import HomePage from "./components/HomePage";
import RetailerDashboard from "./components/dashboards/RetailerDashboard";
import CustomerDashboard from "./components/dashboards/CustomerDashboard";
import WholesalerDashboard from "./components/dashboards/WholesalerDashboard";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import { useCart } from "./context/CartContext";
import OrderTracking from "./pages/OrderTracking";
import DeliveryPartnerDashboard from './pages/DeliveryPartnerDashboard';
import OrderManagement from "./components/order-management";
import AuthCallback from "./components/AuthCallback";
import MockPaymentGateway from "./MockPaymentGateway";
import Queries from "./pages/Queries";
import QueryDetails from "./pages/QueryDetails";
import QueryManagement from "./components/QueryManagement";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './index.css';
import FAQ from './pages/FAQ';

type UserRole = "customer" | "retailer" | "wholesaler" | "delivery_partner" | null;

function ProtectedRoute({ children, allowedRoles, userRole }: { children: React.ReactNode; allowedRoles: UserRole[]; userRole: UserRole; }) {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(userRole)) {
    if (userRole === "customer") return <Navigate to="/customer" replace />;
    else if (userRole === "retailer") return <Navigate to="/retailer" replace />;
    else if (userRole === "delivery_partner") return <Navigate to="/delivery-dashboard" replace />;
    else if (userRole === "wholesaler") return <Navigate to="/wholesaler" replace />;
  }
  return <>{children}</>;
}

function Navbar({ isLoggedIn, onLogout, userRole }: { isLoggedIn: boolean; onLogout: () => void; userRole: UserRole; }) {
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogoutClick = () => {
    onLogout();
    navigate("/");
    setIsMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  // If not logged in, show the original navbar
  if (!isLoggedIn) {
    return (
      <nav className="gradient-hero shadow-lg p-4 mb-0">
        <div className="container mx-auto flex justify-between items-center">
          <button onClick={() => navigate("/")} className="text-2xl font-bold text-white hover:scale-105 transition-transform cursor-pointer flex items-center gap-2">
            🛒 Live MART
          </button>
          <div className="flex gap-4 items-center">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            
            <button 
              onClick={() => navigate('/faq')} 
              className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold flex items-center gap-2"
            >
              ❓ FAQ
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className="px-6 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold border border-white border-opacity-50"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')} 
              className="px-6 py-2 rounded-lg bg-accent text-white hover:bg-[hsl(var(--accent-hover))] transition-all font-semibold shadow-md"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // Logged in navbar with hamburger menu
  return (
    <nav className="gradient-hero shadow-lg p-4 mb-0 relative">
      <div className="container mx-auto flex justify-between items-center">
        <button onClick={() => handleNavigation("/")} className="text-2xl font-bold text-white hover:scale-105 transition-transform cursor-pointer flex items-center gap-2">
          🛒 Live MART
        </button>
        
        {/* Cart Icon for Customers - Always visible on right */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          {userRole === "customer" && (
            <button 
              onClick={() => handleNavigation('/cart')} 
              className="relative px-4 py-2 rounded-lg bg-accent text-white hover:bg-[hsl(var(--accent-hover))] transition-all font-semibold shadow-md"
            >
              🛒 Cart
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                  {getCartCount()}
                </span>
              )}
            </button>
          )}
          
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Sliding Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isMenuOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Sliding Menu Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Menu</h2>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {userRole === "customer" && (
              <>
                <button 
                  onClick={() => handleNavigation('/customer')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  🛍️ Shop Products
                </button>
                <button 
                  onClick={() => handleNavigation('/orders')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  📦 My Orders
                </button>
                <button 
                  onClick={() => handleNavigation('/queries')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  💬 Queries
                </button>
                <button 
                  onClick={() => handleNavigation('/faq')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  ❓ FAQ
                </button>
                <div className="border-t border-border my-4"></div>
                <button 
                  onClick={() => handleNavigation('/profile')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  👤 Profile
                </button>
                <button 
                  onClick={handleLogoutClick} 
                  className="w-full text-left px-4 py-3 hover:bg-secondary/10 rounded-lg transition-all flex items-center gap-3 text-secondary font-semibold"
                >
                  🚪 Logout
                </button>
              </>
            )}

            {userRole === "retailer" && (
              <>
                <button 
                  onClick={() => handleNavigation('/retailer')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  📊 Retailer Dashboard
                </button>
                <button 
                  onClick={() => handleNavigation('/order-management')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  📋 Order Management
                </button>
                <button 
                  onClick={() => handleNavigation('/retailer/queries')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  💬 Query Management
                </button>
                <button 
                  onClick={() => handleNavigation('/faq')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  ❓ FAQ
                </button>
                <div className="border-t border-border my-4"></div>
                <button 
                  onClick={() => handleNavigation('/profile')} 
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  👤 Profile
                </button>
                <button 
                  onClick={handleLogoutClick} 
                  className="w-full text-left px-4 py-3 hover:bg-secondary/10 rounded-lg transition-all flex items-center gap-3 text-secondary font-semibold"
                >
                  🚪 Logout
                </button>
              </>
            )}

            {userRole === "wholesaler" && (
              <>
                <button 
                  onClick={() => handleNavigation('/wholesaler')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  🏭 Wholesaler Dashboard
                </button>
                <button 
                  onClick={() => handleNavigation('/order-management')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  📋 Order Management
                </button>
                <button 
                  onClick={() => handleNavigation('/faq')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  ❓ FAQ
                </button>
                <div className="border-t border-border my-4"></div>
                <button 
                  onClick={() => handleNavigation('/profile')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  👤 Profile
                </button>
                <button 
                  onClick={handleLogoutClick} 
                  className="w-full text-left px-4 py-3 hover:bg-secondary/10 rounded-lg transition-all flex items-center gap-3 text-secondary font-semibold"
                >
                  🚪 Logout
                </button>
              </>
            )}

            {userRole === "delivery_partner" && (
              <>
                <button 
                  onClick={() => handleNavigation('/delivery-dashboard')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  🚚 Delivery Dashboard
                </button>
                <button 
                  onClick={() => handleNavigation('/faq')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  ❓ FAQ
                </button>
                <div className="border-t border-border my-4"></div>
                <button 
                  onClick={() => handleNavigation('/profile')} 
                  className="w-full text-left px-4 py-3 hover:bg-accent/10 rounded-lg transition-all flex items-center gap-3 text-card-foreground font-semibold"
                >
                  👤 Profile
                </button>
                <button 
                  onClick={handleLogoutClick} 
                  className="w-full text-left px-4 py-3 hover:bg-secondary/10 rounded-lg transition-all flex items-center gap-3 text-secondary font-semibold"
                >
                  🚪 Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted) return;
        if (user) {
          setUserId(user.id);
          setIsLoggedIn(true);
          const { data: userData, error } = await supabase.from("users").select("role").eq("auth_id", user.id).single();
          if (!mounted) return;
          if (!error && userData) setUserRole(userData.role as UserRole);
        } else {
          setUserId(null);
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (mounted) { setUserId(null); setIsLoggedIn(false); setUserRole(null); }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) { console.warn("Auth loading timeout - forcing completion"); setIsLoading(false); }
    }, 3000);

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUserId(session.user.id);
        setIsLoggedIn(true);
        const { data: userData, error } = await supabase.from("users").select("role").eq("auth_id", session.user.id).single();
        if (!mounted) return;
        if (!error && userData) setUserRole(userData.role as UserRole);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => { mounted = false; clearTimeout(timeoutId); listener.subscription.unsubscribe(); };
  }, []);

  const handleLogin = async (id: string) => {
    setUserId(id);
    setIsLoggedIn(true);
    try {
      const { data: userData } = await supabase.from("users").select("role").eq("auth_id", id).single();
      if (userData) setUserRole(userData.role as UserRole);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setIsLoggedIn(false);
    setUserRole(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} userRole={userRole} />
        <Routes>
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login onLogin={handleLogin} userRole={userRole} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Product Detail Page - accessible to everyone */}
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          
          {/* FAQ Page - accessible to everyone */}
          <Route path="/faq" element={<FAQ />} />
          
          {/* Profile Page - accessible to all logged-in users */}
          <Route path="/profile" element={<ProtectedRoute allowedRoles={["customer", "retailer", "wholesaler", "delivery_partner"]} userRole={userRole}><ProfilePage /></ProtectedRoute>} />
          
          <Route path="/customer" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/track-order/:orderId" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><OrderTracking /></ProtectedRoute>} />
          <Route path="/queries" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><Queries /></ProtectedRoute>} />
          <Route path="/query/:queryId" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><QueryDetails /></ProtectedRoute>} />
          <Route path="/retailer/queries" element={<ProtectedRoute allowedRoles={["retailer"]} userRole={userRole}><QueryManagement /></ProtectedRoute>} />
          <Route path="/delivery-dashboard" element={<ProtectedRoute allowedRoles={["delivery_partner"]} userRole={userRole}><DeliveryPartnerDashboard /></ProtectedRoute>} />
          <Route path="/order-management" element={<ProtectedRoute allowedRoles={["retailer", "wholesaler"]} userRole={userRole}><OrderManagement /></ProtectedRoute>} />
          <Route path="/retailer" element={<ProtectedRoute allowedRoles={["retailer"]} userRole={userRole}><RetailerDashboard /></ProtectedRoute>} />
          <Route path="/wholesaler" element={<ProtectedRoute allowedRoles={["wholesaler"]} userRole={userRole}><WholesalerDashboard /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><Checkout /></ProtectedRoute>} />
          <Route path="/order-success/:orderId" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><OrderSuccess /></ProtectedRoute>} />
          <Route path="/mock-payment" element={<MockPaymentGateway />} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={["customer"]} userRole={userRole}><Orders /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;