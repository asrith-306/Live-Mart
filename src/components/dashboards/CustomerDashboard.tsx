// src/components/dashboards/CustomerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { fetchProducts, fetchProductsByCategory, Product } from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';
import { X, Trash2, Plus, Minus, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image_url?: string;
}

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartModal, setShowCartModal] = useState(false);
  const [showAddedNotification, setShowAddedNotification] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<string>('');
  const [lastPurchasedCategory, setLastPurchasedCategory] = useState<string | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minPrice, setMinPrice] = useState<string>('0');
  const [maxPrice, setMaxPrice] = useState<string>('100000');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'stock'>('default');

  const { cartItems, addToCart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart();

  const categories = [
    { name: 'All', icon: '🛍️', color: 'from-primary to-primary-light' },
    { name: 'Books & Stationery', icon: '📚', color: 'from-primary to-accent' },
    { name: 'Electronics', icon: '📱', color: 'from-primary to-primary-glow' },
    { name: 'Clothing', icon: '👕', color: 'from-secondary to-secondary-light' },
    { name: 'Food & Beverages', icon: '🎃', color: 'from-accent to-accent-light' },
    { name: 'Groceries', icon: '🛒', color: 'from-accent-hover to-accent' },
    { name: 'Other', icon: '✨', color: 'from-neutral to-neutral-light' }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const savedCategory = localStorage.getItem('lastPurchasedCategory');
    if (savedCategory) {
      setLastPurchasedCategory(savedCategory);
    }
  }, []);

  useEffect(() => {
    if (lastPurchasedCategory && lastPurchasedCategory !== 'All') {
      loadRecommendations();
    }
  }, [lastPurchasedCategory, cartItems]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const retailerProducts = await fetchProducts();
      
      const { fetchWholesalerProducts } = await import('@/services/productService');
      const wholesalerProducts = await fetchWholesalerProducts();
      
      const productStockMap = new Map<string, { totalStock: number, products: Product[] }>();
      
      retailerProducts.forEach(p => {
        const key = p.name.toLowerCase().trim();
        const existing = productStockMap.get(key);
        
        if (existing) {
          existing.totalStock += (p.stock || 0);
          existing.products.push(p);
        } else {
          productStockMap.set(key, {
            totalStock: p.stock || 0,
            products: [p]
          });
        }
      });
      
      const availableWholesalerProducts = wholesalerProducts.filter(wp => {
        const productKey = wp.name.toLowerCase().trim();
        const retailerData = productStockMap.get(productKey);
        
        if (!retailerData) return true;
        if (retailerData.totalStock === 0) return true;
        
        return false;
      });
      
      const inStockRetailerProducts = retailerProducts.filter(p => (p.stock || 0) > 0);
      const allProducts = [...inStockRetailerProducts, ...availableWholesalerProducts];
      
      setProducts(allProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!lastPurchasedCategory) return;
    
    try {
      const data = await fetchProductsByCategory(lastPurchasedCategory);
      const filtered = data
        .filter((p: Product) => !(cartItems as CartItem[]).find((item: CartItem) => item.id === p.id))
        .slice(0, 5);
      setRecommendedProducts(filtered);
      if (filtered.length > 0) {
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setLastAddedProduct(product.name);
    setShowAddedNotification(true);
    setTimeout(() => setShowAddedNotification(false), 3000);
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      const lastItem = (cartItems as CartItem[])[cartItems.length - 1];
      localStorage.setItem('lastPurchasedCategory', lastItem.category);
    }
    navigate('/checkout');
    setShowCartModal(false);
  };

  const applyPriceFilter = () => {
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || 100000;
    setPriceRange([min, max]);
  };

  const resetFilters = () => {
    setSelectedCategory('All');
    setPriceRange([0, 100000]);
    setMinPrice('0');
    setMaxPrice('100000');
    setStockFilter('all');
    setSortBy('default');
  };

  const getFilteredAndSortedProducts = () => {
    let filtered = products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesCategory && matchesSearch && matchesPrice;
    });

    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => (p.stock || 0) > 10);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    }

    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock') {
      filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    }

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const cartItemCount = getCartCount();
  const cartTotal = getCartTotal();

  const activeFilterCount = 
    (selectedCategory !== 'All' ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 100000 ? 1 : 0) +
    (stockFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'default' ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-xl font-semibold text-foreground">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-hero text-white py-12 px-8 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-5xl font-bold animate-fade-in">🛍️ Discover Amazing Products</h1>
            {cartItemCount > 0 && (
              <button
                onClick={() => setShowCartModal(true)}
                className="bg-white/20 px-6 py-3 rounded-full flex items-center gap-3 hover:bg-white/30 transition-all transform hover:scale-105 cursor-pointer backdrop-blur-sm"
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
              className="w-full px-6 py-4 rounded-full text-foreground bg-card text-lg shadow-lg focus-primary transition-all"
            />
            <span className="absolute right-6 top-1/2 transform -translate-y-1/2 text-2xl">🔍</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Smart Filters Bar */}
        <div className="mb-6 bg-card rounded-xl shadow-md border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-primary text-white px-2 py-0.5 rounded-full text-xs">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredProducts.length}</span> products found
              {searchQuery && (
                <span className="ml-2">
                  for "<span className="font-semibold text-primary">{searchQuery}</span>"
                </span>
              )}
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-border">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  🏷️ Category
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {categories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full px-4 py-2 rounded-lg text-left transition-all flex items-center gap-2 ${
                        selectedCategory === category.name
                          ? 'bg-primary text-white'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  💰 Price Range
                </label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
                  />
                </div>
                <button
                  onClick={applyPriceFilter}
                  className="w-full bg-primary text-white py-2 rounded-lg hover:bg-[hsl(var(--primary-hover))] transition-all text-sm font-semibold"
                >
                  Apply
                </button>
                <div className="mt-2 text-xs text-muted-foreground">
                  Current: ₹{priceRange[0]} - ₹{priceRange[1]}
                </div>
              </div>

              {/* Stock Availability Filter */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  📦 Stock Availability
                </label>
                <div className="space-y-2">
                  {['all', 'in-stock', 'low-stock'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStockFilter(filter as any)}
                      className={`w-full px-4 py-2 rounded-lg text-left transition-all ${
                        stockFilter === filter
                          ? 'bg-primary text-white'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {filter === 'all' ? 'All Products' : filter === 'in-stock' ? 'In Stock (10+)' : 'Low Stock (1-10)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  🔄 Sort By
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'default', label: 'Default' },
                    { value: 'price-low', label: 'Price: Low to High' },
                    { value: 'price-high', label: 'Price: High to Low' },
                    { value: 'stock', label: 'Stock: High to Low' }
                  ].map((sort) => (
                    <button
                      key={sort.value}
                      onClick={() => setSortBy(sort.value as any)}
                      className={`w-full px-4 py-2 rounded-lg text-left transition-all ${
                        sortBy === sort.value
                          ? 'bg-primary text-white'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilterCount > 0 && !showFilters && (
            <div className="flex gap-2 flex-wrap pt-2">
              {selectedCategory !== 'All' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1">
                  🏷️ {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="ml-1 hover:text-primary-hover">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 100000) && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  💰 ₹{priceRange[0]} - ₹{priceRange[1]}
                </span>
              )}
              {stockFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  📦 {stockFilter === 'in-stock' ? 'In Stock' : 'Low Stock'}
                </span>
              )}
              {sortBy !== 'default' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  🔄 {sortBy === 'price-low' ? 'Price ↑' : sortBy === 'price-high' ? 'Price ↓' : 'Stock ↓'}
                </span>
              )}
            </div>
          )}
        </div>

        {searchQuery && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-primary hover:text-[hsl(var(--link-hover))] font-semibold transition-colors"
            >
              Clear search ✕
            </button>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-slide-up relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {!product.retailer_id && (
                  <div className="absolute top-2 left-2 z-10 bg-accent text-white px-2 py-1 rounded-full text-xs font-semibold shadow-lg">
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
            <h3 className="text-2xl font-bold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? `We couldn't find any products matching "${searchQuery}"`
                : activeFilterCount > 0
                ? 'Try adjusting your filters'
                : 'No products available'
              }
            </p>
            {(searchQuery || activeFilterCount > 0) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  resetFilters();
                }}
                className="px-6 py-3 gradient-primary text-white font-semibold rounded-lg hover:shadow-button-hover transition-all transform hover:scale-105"
              >
                View All Products
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notifications, Recommendations, Cart Modal - Continue in next part... */}
      {showAddedNotification && (
        <div className="fixed top-24 right-8 z-50 animate-slide-in">
          <div className="bg-accent text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold">Added to cart!</p>
              <p className="text-sm opacity-90">{lastAddedProduct}</p>
            </div>
          </div>
        </div>
      )}

      {!showRecommendations && recommendedProducts.length > 0 && (
        <button
          onClick={() => setShowRecommendations(true)}
          className="fixed bottom-8 right-8 gradient-feature text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-glow-accent transition-all transform hover:scale-105 z-40 flex items-center gap-3 animate-bounce-subtle"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Recommended for You</span>
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{recommendedProducts.length}</span>
        </button>
      )}

      {recommendedProducts.length > 0 && showRecommendations && (
        <div className="fixed top-1/2 right-0 transform -translate-y-1/2 transition-all duration-300 z-40 animate-slide-in-right">
          <div className="bg-card border-l border-border rounded-l-2xl shadow-2xl overflow-hidden" style={{ width: '320px' }}>
            <div className="gradient-feature text-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Recommended for You</h3>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-white/90">Based on your {lastPurchasedCategory} purchase</p>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-muted rounded-lg p-3 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-background rounded-lg flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{product.name}</h4>
                      <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                      <p className="text-lg font-bold text-primary">₹{product.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full mt-2 gradient-primary text-white py-2 rounded-lg text-sm font-semibold hover:shadow-button-hover transition-all"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCartModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowCartModal(false)}
        >
          <div 
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gradient-primary text-white p-6">
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

            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🛒</div>
                  <p className="text-muted-foreground text-xl font-medium">Your cart is empty</p>
                  <p className="text-muted-foreground mt-2">Add some products to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(cartItems as CartItem[]).map((item: CartItem) => (
                    <div key={item.id} className="flex gap-4 bg-muted p-5 rounded-xl hover:shadow-md transition-shadow">
                      <div className="w-24 h-24 bg-background rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-lg mb-1">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                        <p className="text-xl font-bold text-primary">₹{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-secondary hover:text-[hsl(var(--secondary-hover))] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                        <div className="flex items-center gap-2 bg-background rounded-lg border-2 border-border">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-2 hover:bg-muted rounded-l-lg transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-bold text-lg text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-2 hover:bg-muted rounded-r-lg transition-colors"
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

            {cartItems.length > 0 && (
              <div className="border-t-2 border-border p-6 bg-muted">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xl font-semibold text-foreground">Total Amount:</span>
                  <span className="text-3xl font-bold text-primary">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-button-hover transition-all transform hover:scale-[1.02] shadow-lg"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

        @keyframes slide-in-right {
          from { 
            opacity: 0; 
            transform: translateY(-50%) translateX(100%);
          }
          to { 
            opacity: 1; 
            transform: translateY(-50%) translateX(0);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
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

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;