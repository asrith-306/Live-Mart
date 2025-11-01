import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";

type Product = {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  stock?: number | null;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 🧠 Debounced search logic
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query, category);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, category]);

  // 🔍 Fetch products from Supabase
  async function fetchResults(search: string, categoryFilter: string) {
    setLoading(true);

    let queryBuilder = supabase
      .from("products")
      .select("id, name, price, category, stock");

    if (search.trim()) queryBuilder = queryBuilder.ilike("name", `%${search}%`);
    if (categoryFilter) queryBuilder = queryBuilder.eq("category", categoryFilter);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching products:", error);
      setResults([]);
    } else {
      setResults(data ?? []);
    }

    setLoading(false);
  }

  return (
    <div className="p-4 border rounded-xl shadow-sm bg-white max-w-xl mx-auto mt-6">
      <h2 className="text-lg font-semibold mb-2">🔍 Search Products</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
          className="border rounded p-2 flex-grow"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded p-2"
        >
          <option value="">All Categories</option>
          <option value="Fruits">Fruits</option>
          <option value="Bakery">Bakery</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Dairy">Dairy</option>
          <option value="Snacks">Snacks</option>
        </select>
      </div>

      {loading && <p className="text-gray-500 mt-2 text-sm">Loading...</p>}

      <ul className="mt-4 divide-y">
        {results.length > 0 ? (
          results.map((p) => (
            <li key={p.id} className="py-2 px-1 hover:bg-gray-50 rounded">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">
                ₹{p.price} {p.category && `• ${p.category}`}{" "}
                {p.stock && p.stock > 0 ? "• In Stock" : "• Out of Stock"}
              </div>
            </li>
          ))
        ) : (
          !loading &&
          query && <p className="text-gray-500 text-sm">No products found.</p>
        )}
      </ul>
    </div>
  );
}
