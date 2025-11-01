import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./utils/supabaseClient"
import Signup from "./Signup.js";
import Login from "./login.js";
import SearchBar from "./components/SearchBar";
import FeedbackForm from "./components/FeedbackForm";
import Navigation from "./components/Navigation";
import HomePage from "./components/HomePage";
import RetailerDashboard from "./components/dashboards/RetailerDashboard";
import CustomerDashboard from "./components/dashboards/CustomerDashboard";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import { useCart } from "./context/CartContext";

type Product = {
  id: string;
  name: string;
  price?: number;
  category?: string;
};

// Enhanced Navbar with both authentication and view switching
function Navbar({ isLoggedIn, onLogout }: { isLoggedIn: boolean; onLogout: () => void }) {
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [view, setView] = useState<'retailer' | 'customer'>('customer');

  const handleViewChange = (newView: 'retailer' | 'customer') => {
    setView(newView);
    navigate(newView === 'retailer' ? '/retailer' : '/customer');
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md p-4 mb-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-500">
          Live MART
        </Link>

        <div className="flex gap-4 items-center">
          {/* Show view switcher only if logged in */}
          {isLoggedIn && (
            <>
              <button
                onClick={() => handleViewChange('customer')}
                className={`px-4 py-2 rounded ${
                  view === 'customer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Customer View
              </button>
              <button
                onClick={() => handleViewChange('retailer')}
                className={`px-4 py-2 rounded ${
                  view === 'retailer' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                Retailer View
              </button>
            </>
          )}

          {/* Customer-specific navigation */}
          {isLoggedIn && view === 'customer' && (
            <>
              <Link
                to="/orders"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                My Orders
              </Link>
              <Link
                to="/cart"
                className="relative px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              >
                🛒 Cart
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* Auth buttons */}
          {isLoggedIn ? (
            <button
              onClick={handleLogoutClick}
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🧠 Get the logged-in user from Supabase Auth
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setIsLoggedIn(true);
      } else {
        setUserId(null);
        setIsLoggedIn(false);
      }
    }

    getUser();

    // Also listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🛍 Fetch all products
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, category")
        .order("name", { ascending: true });

      if (error) console.error("Error fetching products:", error.message);
      else setProducts(data || []);
    }

    fetchProducts();
  }, []);

  const handleLogin = (id: string) => {
    setUserId(id);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        
        <Routes>
          {/* 🏠 Home Page */}
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          
          {/* ✍️ Signup Page */}
          <Route path="/signup" element={<Signup />} />
          
          {/* 🔐 Login Page */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          
          {/* 🛒 Customer Dashboard */}
          <Route path="/customer" element={<CustomerDashboard />} />
          
          {/* 🏪 Retailer Dashboard */}
          <Route path="/retailer" element={<RetailerDashboard />} />
          
          {/* 🛒 Cart & Orders */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
          
          {/* 🛒 Original Dashboard with Feedback */}
          <Route
            path="/dashboard"
            element={
              <div
                style={{
                  padding: "30px",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                <h1 style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                  🛍️ Live-Mart Dashboard
                </h1>

                <SearchBar />

                <h2 style={{ marginTop: "2rem", marginBottom: "0.5rem" }}>
                  All Products
                </h2>

                <ul style={{ listStyle: "none", padding: 0 }}>
                  {products.length > 0 ? (
                    products.map((p) => (
                      <li
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          borderBottom: "1px solid #ddd",
                          padding: "8px 0",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {p.name} {p.category ? `(${p.category})` : ""}
                        </span>
                        {p.price && <span>₹{p.price}</span>}
                      </li>
                    ))
                  ) : (
                    <p>No products found</p>
                  )}
                </ul>

                {selectedProduct && (
                  <div
                    style={{
                      marginTop: "2rem",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                    }}
                  >
                    <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                      Leave feedback for: {selectedProduct.name}
                    </h3>

                    {userId ? (
                      <FeedbackForm
                        productId={selectedProduct.id}
                        userId={userId}
                      />
                    ) : (
                      <p style={{ color: "red" }}>
                        ⚠️ Please log in to submit feedback.
                      </p>
                    )}

                    <button
                      onClick={() => setSelectedProduct(null)}
                      style={{
                        marginTop: "0.5rem",
                        backgroundColor: "#ccc",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;