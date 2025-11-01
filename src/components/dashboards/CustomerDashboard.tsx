// src/components/dashboards/CustomerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { fetchProducts, fetchProductsByCategory, Product } from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';

const CustomerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Electronics', 'Clothing', 'Food', 'Home', 'Books', 'Other'];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = selectedCategory === 'All' 
        ? await fetchProducts()
        : await fetchProductsByCategory(selectedCategory);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Shop Products</h1>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            isRetailer={false}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          No products found in this category.
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;