import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Signup from "./Signup.js";
import Login from "./login.js";
import SearchBar from "./components/SearchBar";
import FeedbackForm from "./components/FeedbackForm";
import Navigation from "./components/Navigation";
import HomePage from "./components/HomePage";

type Product = {
  id: string;
  name: string;
  price?: number;
  category?: string;
};

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
      <Navigation isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <Routes>
          {/* 🏠 Home Page */}
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          
          {/* ✍️ Signup Page */}
          <Route path="/signup" element={<Signup />} />
          
          {/* 🔐 Login Page */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          
          {/* 🛒 Dashboard */}
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
