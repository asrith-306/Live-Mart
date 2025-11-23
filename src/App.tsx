// src/App.tsx - Updated with role-based redirect helper

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
import MockPaymentGateway from "./MockPaymentGateway";
import Queries from "./pages/Queries";
import QueryDetails from "./pages/QueryDetails";
import QueryManagement from "./components/QueryManagement";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './index.css';
import FAQ from './pages/FAQ';
import AuthCallback from "./pages/AuthCallback";

type UserRole = "customer" | "retailer" | "wholesaler" | "delivery_partner" | null;

// 🔥 CENTRAL DASHBOARD PATH HELPER
function getDashboardPath(role: UserRole) {
  switch (role) {
    case "customer": return "/customer";
    case "retailer": return "/retailer";
    case "wholesaler": return "/wholesaler";
    case "delivery_partner": return "/delivery-dashboard";
    default: return "/";
  }
}

// 🔥 CLEAN PROTECTED ROUTE
function ProtectedRoute({
  children,
  allowedRoles,
  userRole
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  userRole: UserRole;
}) {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  return <>{children}</>;
}


// ------------------------- NAVBAR (same as your code) -------------------------
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

  // NON-LOGGED NAVBAR
  if (!isLoggedIn) {
    return (
      <nav className="gradient-hero shadow-lg p-4 mb-0">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer"
          >
            <img 
              src="/logo.png" 
              alt="Live MART Logo" 
              className="h-16 w-16 object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallbackEmoji = e.currentTarget.nextElementSibling;
                if (fallbackEmoji && fallbackEmoji instanceof HTMLElement) {
                  fallbackEmoji.style.display = 'inline';
                }
              }}
            />
            <span className="text-3xl" style={{ display: 'none' }}>🛒</span>
            <span className="text-2xl font-bold text-white">Live MART</span>
          </button>

          <div className="flex gap-4 items-center">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            <button 
              onClick={() => navigate('/faq')} 
              className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all"
            >
              ❓ FAQ
            </button>

            <button 
              onClick={() => navigate('/login')} 
              className="px-6 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white border-opacity-50"
            >
              Sign In
            </button>

            <button 
              onClick={() => navigate('/signup')} 
              className="px-6 py-2 rounded-lg bg-accent text-white hover:bg-[hsl(var(--accent-hover))] transition-all shadow-md"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // LOGGED IN NAVBAR
  return (
    <nav className="gradient-hero shadow-lg p-4 mb-0 relative">
      <div className="container mx-auto flex justify-between items-center">
        <button 
          onClick={() => handleNavigation("/")} 
          className="flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <img 
            src="/logo.png" 
            alt="Live MART Logo" 
            className="h-16 w-16 object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextElementSibling;
              if (fb instanceof HTMLElement) fb.style.display = 'inline';
            }}
          />
          <span className="text-3xl" style={{ display: 'none' }}>🛒</span>
          <span className="text-2xl font-bold text-white">Live MART</span>
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {userRole === "customer" && (
            <button 
              onClick={() => handleNavigation('/cart')}
              className="relative px-4 py-2 rounded-lg bg-accent text-white hover:bg-[hsl(var(--accent-hover))] shadow-md"
            >
              🛒 Cart
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {getCartCount()}
                </span>
              )}
            </button>
          )}

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isMenuOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Slide Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-card shadow-2xl z-50 transform transition-transform duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Menu</h2>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg"
            >
              ✖
            </button>
          </div>

          {/* ROLE-MENU */}
          <div className="space-y-2">
            {userRole === "customer" && (
              <>
                <button onClick={() => handleNavigation('/customer')} className="menu-btn">🛍️ Shop Products</button>
                <button onClick={() => handleNavigation('/orders')} className="menu-btn">📦 My Orders</button>
                <button onClick={() => handleNavigation('/queries')} className="menu-btn">💬 Queries</button>
                <button onClick={() => handleNavigation('/faq')} className="menu-btn">❓ FAQ</button>
                <div className="divider" />
                <button onClick={() => handleNavigation('/profile')} className="menu-btn">👤 Profile</button>
                <button onClick={handleLogoutClick} className="logout-btn">🚪 Logout</button>
              </>
            )}

            {userRole === "retailer" && (
              <>
                <button onClick={() => handleNavigation('/retailer')} className="menu-btn">📊 Retailer Dashboard</button>
                <button onClick={() => handleNavigation('/order-management')} className="menu-btn">📋 Order Management</button>
                <button onClick={() => handleNavigation('/retailer/queries')} className="menu-btn">💬 Query Management</button>
                <button onClick={() => handleNavigation('/faq')} className="menu-btn">❓ FAQ</button>
                <div className="divider" />
                <button onClick={() => handleNavigation('/profile')} className="menu-btn">👤 Profile</button>
                <button onClick={handleLogoutClick} className="logout-btn">🚪 Logout</button>
              </>
            )}

            {userRole === "wholesaler" && (
              <>
                <button onClick={() => handleNavigation('/wholesaler')} className="menu-btn">🏭 Wholesaler Dashboard</button>
                <button onClick={() => handleNavigation('/order-management')} className="menu-btn">📋 Order Management</button>
                <button onClick={() => handleNavigation('/faq')} className="menu-btn">❓ FAQ</button>
                <div className="divider" />
                <button onClick={() => handleNavigation('/profile')} className="menu-btn">👤 Profile</button>
                <button onClick={handleLogoutClick} className="logout-btn">🚪 Logout</button>
              </>
            )}

            {userRole === "delivery_partner" && (
              <>
                <button onClick={() => handleNavigation('/delivery-dashboard')} className="menu-btn">🚚 Delivery Dashboard</button>
                <button onClick={() => handleNavigation('/faq')} className="menu-btn">❓ FAQ</button>
                <div className="divider" />
                <button onClick={() => handleNavigation('/profile')} className="menu-btn">👤 Profile</button>
                <button onClick={handleLogoutClick} className="logout-btn">🚪 Logout</button>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}



// ------------------------- MAIN APP CONTENT -------------------------
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

          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", user.id)
            .single();

          if (userData) setUserRole(userData.role as UserRole);
        } else {
          setUserId(null);
          setIsLoggedIn(false);
          setUserRole(null);
        }

      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    const timeout = setTimeout(() => {
      if (mounted && isLoading) setIsLoading(false);
    }, 3000);

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const id = session.user.id;
        setUserId(id);
        setIsLoggedIn(true);

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("auth_id", id)
          .single();

        if (userData) setUserRole(userData.role as UserRole);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
        setUserRole(null);
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      listener.subscription.unsubscribe();
    };
  }, []);


  const handleLogin = async (id: string) => {
    setUserId(id);
    setIsLoggedIn(true);

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", id)
      .single();

    if (userData) setUserRole(userData.role as UserRole);
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

          {/* Public */}
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login onLogin={handleLogin} userRole={userRole} />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/faq" element={<FAQ />} />

          {/* Profile for all roles */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={["customer","retailer","wholesaler","delivery_partner"]} userRole={userRole}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Customer */}
          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/track-order/:orderId" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <OrderTracking />
            </ProtectedRoute>
          } />
          <Route path="/queries" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <Queries />
            </ProtectedRoute>
          } />
          <Route path="/query/:queryId" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <QueryDetails />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <Cart />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/order-success/:orderId" element={
            <ProtectedRoute allowedRoles={["customer"]} userRole={userRole}>
              <OrderSuccess />
            </ProtectedRoute>
          } />

          {/* Retailer */}
          <Route path="/retailer" element={
            <ProtectedRoute allowedRoles={["retailer"]} userRole={userRole}>
              <RetailerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/retailer/queries" element={
            <ProtectedRoute allowedRoles={["retailer"]} userRole={userRole}>
              <QueryManagement />
            </ProtectedRoute>
          } />

          {/* Wholesaler */}
          <Route path="/wholesaler" element={
            <ProtectedRoute allowedRoles={["wholesaler"]} userRole={userRole}>
              <WholesalerDashboard />
            </ProtectedRoute>
          } />

          {/* Retailer + Wholesaler shared */}
          <Route path="/order-management" element={
            <ProtectedRoute allowedRoles={["retailer","wholesaler"]} userRole={userRole}>
              <OrderManagement />
            </ProtectedRoute>
          } />

          {/* Delivery Partner */}
          <Route path="/delivery-dashboard" element={
            <ProtectedRoute allowedRoles={["delivery_partner"]} userRole={userRole}>
              <DeliveryPartnerDashboard />
            </ProtectedRoute>
          } />

          {/* Test Payment */}
          <Route path="/mock-payment" element={<MockPaymentGateway />} />

        </Routes>
      </div>
    </Router>
  );
}


// ------------------ ROOT COMPONENT ------------------
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
