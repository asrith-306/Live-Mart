// src/components/dashboards/CustomerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { fetchProducts, fetchProductsByCategory, Product } from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';
import FeedbackForm from '@/components/FeedbackForm';
import { supabase } from '@/utils/supabaseClient';

const CustomerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const categories = [
    { name: 'All', icon: '🛍️', color: 'from-purple-500 to-pink-500' },
    { name: 'Electronics', icon: '📱', color: 'from-blue-500 to-cyan-500' },
    { name: 'Clothing', icon: '👕', color: 'from-pink-500 to-rose-500' },
    { name: 'Food', icon: '🍎', color: 'from-green-500 to-emerald-500' },
    { name: 'Home', icon: '🏠', color: 'from-orange-500 to-amber-500' },
    { name: 'Books', icon: '📚', color: 'from-indigo-500 to-purple-500' },
    { name: 'Other', icon: '✨', color: 'from-gray-500 to-slate-500' }
  ];

  // Get current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

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

  const handleProductClick = (product: Product) => {
    // Only open modal if product has an id
    if (product.id) {
      setSelectedProduct(product);
      setShowFeedbackModal(true);
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-12 px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">
            🛍️ Discover Amazing Products
          </h1>
          <p className="text-xl opacity-90 mb-6">
            Explore our curated collection of quality items
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-full text-gray-800 text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
            />
            <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl">
              🔍
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Browse by Category</h2>
          <div className="flex gap-3 flex-wrap">
            {categories.map(category => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  selectedCategory === category.name
                    ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                <span className="text-2xl mr-2">{category.icon}</span>
                {category.name}
                {selectedCategory === category.name && (
                  <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Products Count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg text-gray-600">
            <span className="font-semibold text-gray-800">{filteredProducts.length}</span> products found
            {searchQuery && (
              <span className="ml-2">
                for "<span className="font-semibold text-purple-600">{searchQuery}</span>"
              </span>
            )}
          </div>
          
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
            >
              Clear search ✕
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div onClick={() => handleProductClick(product)} className="cursor-pointer">
                  <ProductCard
                    product={product}
                    isRetailer={false}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  ⭐ Leave Feedback
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">😔</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `We couldn't find any products matching "${searchQuery}"`
                : `No products available in the ${selectedCategory} category`
              }
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
              >
                View All Products
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedProduct && selectedProduct.id && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={closeFeedbackModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                  <p className="text-white/80 mt-1">Share your experience with this product</p>
                </div>
                <button
                  onClick={closeFeedbackModal}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {userId ? (
                <FeedbackForm
                  productId={selectedProduct.id}
                  userId={userId}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">Login Required</p>
                  <p className="text-gray-600 mb-4">
                    Please log in to submit feedback for this product
                  </p>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeFeedbackModal}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;