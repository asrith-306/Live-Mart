// src/App.tsx - FINAL VERSION WITH PROFILE AND FAQ
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

  const handleLogoutClick = () => {
    onLogout();
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg p-4 mb-0">
      <div className="container mx-auto flex justify-between items-center">
        <button onClick={() => navigate("/")} className="text-2xl font-bold text-white hover:scale-105 transition-transform cursor-pointer flex items-center gap-2">
          🛒 Live MART
        </button>
        <div className="flex gap-4 items-center">
          {/* FAQ Link - Always visible */}
          <button 
            onClick={() => navigate('/faq')} 
            className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold flex items-center gap-2"
          >
            ❓ FAQ
          </button>

          {!isLoggedIn && (
            <>
              <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold border border-white border-opacity-50">Sign In</button>
              <button onClick={() => navigate('/signup')} className="px-6 py-2 rounded-lg bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition-all font-semibold shadow-md">Sign Up</button>
            </>
          )}
          {isLoggedIn && (
            <>
              {userRole === "customer" && (
                <>
                  <button onClick={() => navigate('/customer')} className="px-4 py-2 rounded-lg bg-white text-blue-600 shadow-md font-semibold hover:bg-opacity-90 transition-all">Shop Products</button>
                  <button onClick={() => navigate('/orders')} className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold">My Orders</button>
                  <button onClick={() => navigate('/queries')} className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold">💬 Queries</button>
                  <button onClick={() => navigate('/cart')} className="relative px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-all font-semibold">
                    🛒 Cart
                    {getCartCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">{getCartCount()}</span>
                    )}
                  </button>
                </>
              )}
              {userRole === "retailer" && (
                <button onClick={() => navigate('/retailer')} className="px-4 py-2 rounded-lg bg-white text-purple-600 shadow-md font-semibold hover:bg-opacity-90 transition-all">Retailer Dashboard</button>
              )}
              {userRole === "delivery_partner" && (
                <button onClick={() => navigate('/delivery-dashboard')} className="px-4 py-2 rounded-lg bg-white text-green-600 shadow-md font-semibold hover:bg-opacity-90 transition-all">Delivery Dashboard</button>
              )}
              {userRole === "wholesaler" && (
                <button onClick={() => navigate('/wholesaler')} className="px-4 py-2 rounded-lg bg-white text-green-600 shadow-md font-semibold hover:bg-opacity-90 transition-all">Wholesaler Dashboard</button>
              )}
              
              {/* Profile Button */}
              <button onClick={() => navigate('/profile')} className="px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 transition-all font-semibold flex items-center gap-2">
                👤 Profile
              </button>
              
              <button onClick={handleLogoutClick} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all font-semibold shadow-md">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
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

export default App;