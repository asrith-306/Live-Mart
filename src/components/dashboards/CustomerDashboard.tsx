// src/components/dashboards/CustomerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { fetchProducts, fetchProductsByCategory, Product } from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext'; // Import useCart

const CustomerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [showAddedNotification, setShowAddedNotification] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<string>('');

  // Use CartContext instead of local state
  const { cartItems, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();

  const categories = [
    { name: 'All', icon: '🛍️', color: 'from-purple-500 to-pink-500' },
    { name: 'Electronics', icon: '📱', color: 'from-blue-500 to-cyan-500' },
    { name: 'Clothing', icon: '👕', color: 'from-pink-500 to-rose-500' },
    { name: 'Food', icon: '🍎', color: 'from-green-500 to-emerald-500' },
    { name: 'Home', icon: '🏠', color: 'from-orange-500 to-amber-500' },
    { name: 'Books', icon: '📚', color: 'from-indigo-500 to-purple-500' },
    { name: 'Other', icon: '✨', color: 'from-gray-500 to-slate-500' }
  ];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
  try {
    setLoading(true);
    
    // Fetch retailer products (their actual inventory)
    let retailerProducts = selectedCategory === 'All' 
      ? await fetchProducts()
      : await fetchProductsByCategory(selectedCategory);
    
    // Also fetch wholesaler products that are available
    const { fetchWholesalerProducts } = await import('@/services/productService');
    const wholesalerProducts = await fetchWholesalerProducts();
    
    // Get retailer product IDs to avoid duplicates
    const retailerProductIds = new Set(retailerProducts.map(p => p.id));
    
    // Filter wholesaler products that aren't already sold by retailers
    const availableWholesalerProducts = wholesalerProducts.filter(
      wp => !retailerProductIds.has(wp.id)
    );
    
    // Combine both - customers see everything available
    const allProducts = [...retailerProducts, ...availableWholesalerProducts];
    
    setProducts(allProducts);
  } catch (error) {
    console.error('Failed to load products:', error);
    alert('Failed to load products');
  } finally {
    setLoading(false);
  }
};

  const handleAddToCart = (product: Product) => {
    console.log('Adding product to cart:', product);
    addToCart(product, 1); // Use CartContext's addToCart
    
    // Show notification
    setLastAddedProduct(product.name);
    setShowAddedNotification(true);
    setTimeout(() => setShowAddedNotification(false), 3000);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartItemCount = getCartCount(); // Use CartContext's getCartCount
  const cartTotal = getCartTotal(); // Use CartContext's getCartTotal

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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-5xl font-bold animate-fade-in">🛍️ Discover Amazing Products</h1>
            {/* Cart indicator */}
            {cartItemCount > 0 && (
              <button
                onClick={() => setShowCartModal(true)}
                className="bg-white/20 px-6 py-3 rounded-full flex items-center gap-3 hover:bg-white/30 transition-all transform hover:scale-105 cursor-pointer"
              >
                <span className="text-2xl">🛒</span>
                <span className="font-semibold text-lg">{cartItemCount} items</span>
                <span className="text-sm opacity-90">₹{cartTotal.toFixed(2)}</span>
              </button>
            )}
          </div>
          <p className="text-xl opacity-90 mb-6">Explore our curated collection of quality items</p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-full text-gray-800 text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 transition-all"
            />
            <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
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
                className="animate-slide-up relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Show badge if product is from wholesaler (no retailer_id) */}
                {!product.retailer_id && (
                  <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
                    🏭 Direct from Wholesaler
              </div>
  )}
  <ProductCard
    product={product}
    onAddToCart={handleAddToCart}
  />
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

      {/* Added to Cart Notification */}
      {showAddedNotification && (
        <div className="fixed top-24 right-8 z-50 animate-slide-in">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold">Added to cart!</p>
              <p className="text-sm opacity-90">{lastAddedProduct}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal - Big popup with blurred background, center aligned */}
      {showCartModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowCartModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <span>🛒</span> Your Shopping Cart
                </h2>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-white/90 mt-2 text-lg">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your cart</p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🛒</div>
                  <p className="text-gray-600 text-xl font-medium">Your cart is empty</p>
                  <p className="text-gray-500 mt-2">Add some products to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-gray-50 p-5 rounded-xl hover:shadow-md transition-shadow">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                        <p className="text-xl font-bold text-purple-600">₹{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                        <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-gray-300">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-bold text-lg">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xl font-semibold text-gray-800">Total Amount:</span>
                  <span className="text-3xl font-bold text-purple-600">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] shadow-lg"
                  onClick={() => {
                    alert('Proceeding to checkout...');
                    setShowCartModal(false);
                  }}
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
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

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;