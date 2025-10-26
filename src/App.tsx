import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Signup from "./Signup.js";
import Login from "./login.js";
import SearchBar from "./components/SearchBar";
import FeedbackForm from "./components/FeedbackForm";

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

  // 🧠 Get the logged-in user from Supabase Auth
  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      else setUserId(null);
    }

    getUser();

    // Also listen for login/logout events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
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

  return (
    <Router>
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <Routes>
          {/* 🏠 Home Page */}
          <Route
            path="/"
            element={
              <div>
                <h1>👋 Welcome to Live Mart</h1>
                <hr style={{ margin: "20px 0" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <Link to="/signup">
                    <button style={{ padding: "10px 20px" }}>📝 Signup</button>
                  </Link>
                  <Link to="/login">
                    <button style={{ padding: "10px 20px" }}>🔐 Login</button>
                  </Link>
                  <Link to="/dashboard">
                    <button style={{ padding: "10px 20px" }}>🛒 Dashboard</button>
                  </Link>
                </div>
              </div>
            }
          />

          {/* ✍️ Signup Page */}
          <Route
            path="/signup"
            element={
              <div>
                <h1>📝 Signup</h1>
                <Signup />
              </div>
            }
          />

          {/* 🔐 Login Page */}
          <Route
            path="/login"
            element={
              <div>
                <h1>🔐 Login</h1>
                <Login />
              </div>
            }
          />

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
