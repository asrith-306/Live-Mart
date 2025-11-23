// src/components/dashboards/RetailerDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchProducts, 
  fetchDeletedProducts,
  fetchWholesalerProducts,
  addRetailerProductFromWholesaler,
  updateProduct, 
  deleteProduct,
  restoreProduct,
  permanentlyDeleteProduct,
  Product 
} from '@/services/productService';
import { fetchRetailerEarnings, EarningsData } from '@/services/earningsService';
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';
import { Package, ShoppingCart, Truck, Eye, EyeOff, MessageCircle, DollarSign } from 'lucide-react';

const RetailerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [wholesalerProducts, setWholesalerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewMode, setViewMode] = useState<'active' | 'trash' | 'wholesaler'>('active');
  const [showAddFromWholesaler, setShowAddFromWholesaler] = useState(false);
  const [selectedWholesalerProduct, setSelectedWholesalerProduct] = useState<Product | null>(null);
  const [orderForm, setOrderForm] = useState({
    quantity: '',
    sellingPrice: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [proxyMode, setProxyMode] = useState(false);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [viewMode]);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const data = await fetchRetailerEarnings();
        setEarnings(data);
      } catch (error) {
        console.error('Failed to load earnings:', error);
      } finally {
        setEarningsLoading(false);
      }
    };
    loadEarnings();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      if (viewMode === 'active') {
        const data = await fetchProducts();
        setProducts(data);
        const wholesalerData = await fetchWholesalerProducts();
        setWholesalerProducts(wholesalerData);
      } else if (viewMode === 'trash') {
        const data = await fetchDeletedProducts();
        setProducts(data);
      } else if (viewMode === 'wholesaler') {
        const data = await fetchWholesalerProducts();
        setWholesalerProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFromWholesaler = (product: Product) => {
    setSelectedWholesalerProduct(product);
    setOrderForm({
      quantity: '',
      sellingPrice: product.price ? (product.price * 1.2).toFixed(2) : ''
    });
    setShowAddFromWholesaler(true);
  };

  const handleConfirmAddFromWholesaler = async () => {
    if (!selectedWholesalerProduct) {
      alert('No product selected');
      return;
    }

    const quantityStr = orderForm.quantity.trim();
    const sellingPriceStr = orderForm.sellingPrice.trim();

    if (!quantityStr || !sellingPriceStr) {
      alert('Please enter both quantity and selling price');
      return;
    }

    const quantity = parseInt(quantityStr, 10);
    const sellingPrice = parseFloat(sellingPriceStr);

    if (isNaN(quantity) || quantity <= 0 || isNaN(sellingPrice) || sellingPrice <= 0) {
      alert('Please enter valid quantity and selling price');
      return;
    }

    if (!selectedWholesalerProduct.stock || quantity > selectedWholesalerProduct.stock) {
      alert(`Only ${selectedWholesalerProduct.stock || 0} units available`);
      return;
    }

    try {
      setSubmitting(true);
      await addRetailerProductFromWholesaler(
        selectedWholesalerProduct,
        quantity,
        sellingPrice
      );
      
      setShowAddFromWholesaler(false);
      setSelectedWholesalerProduct(null);
      setOrderForm({ quantity: '', sellingPrice: '' });
      setViewMode('active');
      alert('Product added to your inventory successfully!');
    } catch (error: any) {
      console.error('Failed to add product:', error);
      alert(`Failed to add product: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      if (!editingProduct?.id) {
        alert('Error: No product ID');
        return;
      }
      
      await updateProduct(editingProduct.id, product);
      setShowForm(false);
      setEditingProduct(undefined);
      await loadProducts();
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Move this product to trash?')) return;
    
    try {
      await deleteProduct(id);
      await loadProducts();
      alert('Product moved to trash!');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  const handleRestoreProduct = async (id: string) => {
    if (!window.confirm('Restore this product?')) return;
    
    try {
      await restoreProduct(id);
      await loadProducts();
      alert('Product restored successfully!');
    } catch (error) {
      console.error('Failed to restore product:', error);
      alert('Failed to restore product.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('⚠️ PERMANENTLY DELETE this product? This cannot be undone!')) return;
    
    try {
      await permanentlyDeleteProduct(id);
      await loadProducts();
      alert('Product permanently deleted!');
    } catch (error) {
      console.error('Failed to permanently delete product:', error);
      alert('Failed to permanently delete product.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const getCombinedProducts = () => {
    if (!proxyMode) return products;

    const retailerProductIds = new Set(products.map(p => p.id));
    const availableWholesalerProducts = wholesalerProducts.filter(
      wp => !retailerProductIds.has(wp.id)
    );

    return [...products, ...availableWholesalerProducts];
  };

  const displayProducts = getCombinedProducts();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-semibold">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Quick Actions Banner */}
      <div className="gradient-hero rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-white text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Earnings */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Earnings</h3>
            </div>
            {earningsLoading ? (
              <p className="text-sm text-white text-opacity-90 mb-3">Loading...</p>
            ) : (
              <>
                <p className="text-2xl font-bold mb-1">
                  ₹{earnings?.totalEarnings.toLocaleString('en-IN') || '0'}
                </p>
                <p className="text-xs text-white text-opacity-75 mb-1">
                  Pending: ₹{earnings?.pendingEarnings.toLocaleString('en-IN') || '0'}
                </p>
                <div className="text-xs text-white text-opacity-75">
                  {earnings?.totalOrders || 0} completed orders
                </div>
              </>
            )}
          </div>

          {/* Manage Products */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Products</h3>
            </div>
            <p className="text-sm text-white text-opacity-90 mb-3">
              {products.length} products in inventory
            </p>
            <button
              onClick={() => setViewMode('wholesaler')}
              className="w-full bg-white text-primary py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              Source Products
            </button>
          </div>

          {/* Order Management */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Orders</h3>
            </div>
            <p className="text-sm text-white text-opacity-90 mb-3">
              Manage customer orders
            </p>
            <button
              onClick={() => navigate('/order-management')}
              className="w-full bg-white text-secondary py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              View Orders
            </button>
          </div>

          {/* Delivery Partners */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Delivery</h3>
            </div>
            <p className="text-sm text-white text-opacity-90 mb-3">
              Assign delivery partners
            </p>
            <button
              onClick={() => navigate('/order-management')}
              className="w-full bg-white text-accent py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              Manage Delivery
            </button>
          </div>

          {/* Customer Queries */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Queries</h3>
            </div>
            <p className="text-sm text-white text-opacity-90 mb-3">
              Customer support queries
            </p>
            <button
              onClick={() => navigate('/retailer/queries')}
              className="w-full bg-white text-accent py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              View Queries
            </button>
          </div>
        </div>
      </div>

      {/* Header with View Toggle and Proxy Mode */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Product Inventory</h1>
          
          {/* View Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'active' 
                  ? 'bg-card text-primary font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Products
            </button>
            <button
              onClick={() => setViewMode('wholesaler')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'wholesaler' 
                  ? 'bg-card text-accent font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏭 Wholesaler Catalog
            </button>
            <button
              onClick={() => setViewMode('trash')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'trash' 
                  ? 'bg-card text-secondary font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🗑️ Trash
            </button>
          </div>
        </div>

        {/* Proxy Availability Toggle */}
        {viewMode === 'active' && (
          <button
            onClick={() => setProxyMode(!proxyMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              proxyMode
                ? 'bg-accent text-white hover:bg-[hsl(var(--accent-hover))]'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {proxyMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            {proxyMode ? 'Proxy Mode: ON' : 'Proxy Mode: OFF'}
          </button>
        )}
      </div>

      {/* Proxy Mode Info Banner */}
      {viewMode === 'active' && proxyMode && (
        <div className="mb-4 p-4 alert-success rounded-lg">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">
                Proxy Availability Mode Active
              </p>
              <p className="text-sm mt-1">
                Showing your inventory + available wholesaler products. Wholesaler products are marked with a "📦 Available via Wholesaler" badge. 
                When customers order these items, they will be automatically sourced from the wholesaler.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid for Active View */}
      {viewMode === 'active' && (
        <>
          {displayProducts.length === 0 && (
            <div className="text-center mt-12">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 max-w-2xl mx-auto">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Products in Your Inventory
                </h3>
                <p className="text-muted-foreground mb-4">
                  As a retailer, you source products from wholesalers. Browse the wholesaler catalog to add products to your inventory.
                </p>
                <button
                  onClick={() => setViewMode('wholesaler')}
                  className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-[hsl(var(--accent-hover))] font-semibold transition-all"
                >
                  Browse Wholesaler Catalog →
                </button>
              </div>
            </div>
          )}
          {displayProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayProducts.map(product => {
                const isWholesalerProduct = !products.find(p => p.id === product.id);
                return (
                  <div key={product.id} className="relative">
                    {isWholesalerProduct && (
                      <div className="absolute top-2 left-2 z-10 bg-accent text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        📦 Available via Wholesaler
                      </div>
                    )}
                    <ProductCard
                      product={product}
                      onEdit={!isWholesalerProduct ? handleEdit : undefined}
                      onDelete={!isWholesalerProduct ? handleDeleteProduct : undefined}
                      onAddToCart={isWholesalerProduct ? () => handleAddFromWholesaler(product) : undefined}
                      isRetailer={true}
                      isTrashView={false}
                    />
                    {isWholesalerProduct && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <button
                          onClick={() => handleAddFromWholesaler(product)}
                          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-[hsl(var(--primary-hover))] transition-all text-sm font-semibold"
                        >
                          Add to Inventory
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Wholesaler Products View */}
      {viewMode === 'wholesaler' && (
        <div>
          <div className="mb-4 p-4 alert-success rounded-lg">
            <p>
              <strong>Browse wholesaler products</strong> - Select products to add to your inventory
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wholesalerProducts.map(product => (
              <div key={product.id} className="bg-card border border-border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-foreground mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                  <p className="text-sm text-muted-foreground mb-1">Category: {product.category}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-accent">₹{product.price}</span>
                    <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                  </div>
                  <button
                    onClick={() => handleAddFromWholesaler(product)}
                    className="w-full bg-primary text-white py-2 rounded-lg hover:bg-[hsl(var(--primary-hover))] transition-all"
                  >
                    Add to My Inventory
                  </button>
                </div>
              </div>
            ))}
          </div>
          {wholesalerProducts.length === 0 && (
            <div className="text-center text-muted-foreground mt-12">
              No wholesaler products available at the moment.
            </div>
          )}
        </div>
      )}

      {/* Trash View */}
      {viewMode === 'trash' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onRestore={handleRestoreProduct}
                onPermanentDelete={handlePermanentDelete}
                isRetailer={true}
                isTrashView={true}
              />
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center text-muted-foreground mt-12">
              Trash is empty. Deleted products will appear here.
            </div>
          )}
        </>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={handleUpdateProduct}
          onCancel={handleCancel}
        />
      )}

      {/* Add from Wholesaler Modal */}
      {showAddFromWholesaler && selectedWholesalerProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-foreground mb-4">Add Product to Inventory</h2>
            
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold text-lg text-foreground">{selectedWholesalerProduct.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedWholesalerProduct.description}</p>
              <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                <span>Wholesaler Price: ₹{selectedWholesalerProduct.price}</span>
                <span>Available: {selectedWholesalerProduct.stock} units</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Quantity to Order *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedWholesalerProduct.stock}
                  value={orderForm.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setOrderForm({...orderForm, quantity: value});
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
                  placeholder="Enter quantity"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Your Selling Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={orderForm.sellingPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setOrderForm({...orderForm, sellingPrice: value});
                    }
                  }}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus-primary transition-base text-foreground"
                  placeholder="Enter your selling price"
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cost: ₹{selectedWholesalerProduct.price} | 
                  Suggested: ₹{(selectedWholesalerProduct.price * 1.2).toFixed(2)} (20% markup)
                </p>
              </div>

              {orderForm.quantity && orderForm.sellingPrice && (
                <div className="p-3 alert-success rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Cost:</span>
                    <span className="font-semibold">
                      ₹{(selectedWholesalerProduct.price * parseInt(orderForm.quantity || '0')).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Potential Revenue:</span>
                    <span className="font-semibold">
                      ₹{(parseFloat(orderForm.sellingPrice || '0') * parseInt(orderForm.quantity || '0')).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-accent border-t border-border pt-1 mt-1">
                    <span>Potential Profit:</span>
                    <span>
                      ₹{((parseFloat(orderForm.sellingPrice || '0') - selectedWholesalerProduct.price) * 
                        parseInt(orderForm.quantity || '0')).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConfirmAddFromWholesaler}
                disabled={submitting}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  submitting 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-[hsl(var(--primary-hover))]'
                }`}
              >
                {submitting ? 'Processing...' : 'Confirm & Add'}
              </button>
              <button
                onClick={() => {
                  setShowAddFromWholesaler(false);
                  setSelectedWholesalerProduct(null);
                  setOrderForm({ quantity: '', sellingPrice: '' });
                }}
                disabled={submitting}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  submitting
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerDashboard;