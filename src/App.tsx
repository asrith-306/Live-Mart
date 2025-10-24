import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
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

  // Temporary user id for demo (replace with actual logged-in user later)
  // const userId = "demo-user-id";
  const userId = "123e4567-e89b-12d3-a456-426614174000";


  // Fetch products on load
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
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "1rem" }}>
        🛒 Live-Mart Dashboard
      </h1>

      {/* 🔍 Search feature */}
      <SearchBar />

      <h2
        style={{
          marginTop: "2rem",
          fontSize: "1.3rem",
          fontWeight: "bold",
          marginBottom: "0.5rem",
        }}
      >
        All Products
      </h2>

      {/* 🧾 Product list */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {products.length > 0 ? (
          products.map((p) => (
            <li
              key={p.id}
              onClick={() => setSelectedProduct(p)} // click product → open feedback
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

      {/* 💬 Feedback Form for selected product */}
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
          <FeedbackForm
            productId={selectedProduct.id}
            userId={userId}
          />
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
  );
}

export default App;
