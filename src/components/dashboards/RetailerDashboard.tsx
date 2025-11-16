// src/components/dashboards/RetailerDashboard.tsx
import { useState, useEffect } from 'react';
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
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';

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

  useEffect(() => {
    loadProducts();
  }, [viewMode]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      if (viewMode === 'active') {
        const data = await fetchProducts();
        setProducts(data);
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
    if (!selectedWholesalerProduct) return;

    const quantity = parseInt(orderForm.quantity);
    const sellingPrice = parseFloat(orderForm.sellingPrice);

    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!sellingPrice || sellingPrice <= 0) {
      alert('Please enter a valid selling price');
      return;
    }

    if (quantity > selectedWholesalerProduct.stock) {
      alert(`Only ${selectedWholesalerProduct.stock} units available`);
      return;
    }

    try {
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
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product. Check console for details.');
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      if (!editingProduct?.id) {
        console.error('No product ID found for update');
        alert('Error: No product ID');
        return;
      }
      
      console.log('Updating product:', editingProduct.id, product);
      await updateProduct(editingProduct.id, product);
      setShowForm(false);
      setEditingProduct(undefined);
      await loadProducts();
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Failed to update product:', error);
      alert('Failed to update product. Check console for details.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!id) {
      console.error('No product ID provided');
      alert('Error: No product ID');
      return;
    }

    if (!window.confirm('Move this product to trash?')) {
      return;
    }
    
    try {
      await deleteProduct(id);
      await loadProducts();
      alert('Product moved to trash!');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Check console for details.');
    }
  };

  const handleRestoreProduct = async (id: string) => {
    if (!id) {
      console.error('No product ID provided');
      alert('Error: No product ID');
      return;
    }

    if (!window.confirm('Restore this product?')) {
      return;
    }
    
    try {
      await restoreProduct(id);
      await loadProducts();
      alert('Product restored successfully!');
    } catch (error) {
      console.error('Failed to restore product:', error);
      alert('Failed to restore product. Check console for details.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!id) {
      console.error('No product ID provided');
      alert('Error: No product ID');
      return;
    }

    if (!window.confirm('⚠️ PERMANENTLY DELETE this product? This cannot be undone!')) {
      return;
    }
    
    try {
      await permanentlyDeleteProduct(id);
      await loadProducts();
      alert('Product permanently deleted!');
    } catch (error) {
      console.error('Failed to permanently delete product:', error);
      alert('Failed to permanently delete product. Check console for details.');
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

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="p-8">
      {/* Header with View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Retailer Dashboard</h1>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('active')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'active' 
                  ? 'bg-white text-blue-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Products
            </button>
            <button
              onClick={() => setViewMode('wholesaler')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'wholesaler' 
                  ? 'bg-white text-green-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🏭 Wholesaler Catalog
            </button>
            <button
              onClick={() => setViewMode('trash')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'trash' 
                  ? 'bg-white text-red-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🗑️ Trash
            </button>
          </div>
        </div>

        {/* Note: No Add Product button - retailers can only source from wholesalers */}
      </div>

      {/* Wholesaler Products View */}
      {viewMode === 'wholesaler' && (
        <div>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              <strong>Browse wholesaler products</strong> - Select products to add to your inventory
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wholesalerProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <p className="text-sm text-gray-500 mb-1">Category: {product.category}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                    <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                  </div>
                  <button
                    onClick={() => handleAddFromWholesaler(product)}
                    className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add to My Inventory
                  </button>
                </div>
              </div>
            ))}
          </div>
          {wholesalerProducts.length === 0 && (
            <div className="text-center text-gray-500 mt-12">
              No wholesaler products available at the moment.
            </div>
          )}
        </div>
      )}

      {/* Active Products View */}
      {viewMode === 'active' && (
        <>
          {products.length === 0 && (
            <div className="text-center mt-12">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Products in Your Inventory
                </h3>
                <p className="text-gray-600 mb-4">
                  As a retailer, you source products from wholesalers. Browse the wholesaler catalog to add products to your inventory.
                </p>
                <button
                  onClick={() => setViewMode('wholesaler')}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold"
                >
                  Browse Wholesaler Catalog →
                </button>
              </div>
            </div>
          )}
          {products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEdit}
                  onDelete={handleDeleteProduct}
                  isRetailer={true}
                  isTrashView={false}
                />
              ))}
            </div>
          )}
        </>
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
            <div className="text-center text-gray-500 mt-12">
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Add Product to Inventory</h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg">{selectedWholesalerProduct.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedWholesalerProduct.description}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span>Wholesaler Price: ₹{selectedWholesalerProduct.price}</span>
                <span>Available: {selectedWholesalerProduct.stock} units</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Order
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedWholesalerProduct.stock}
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Selling Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={orderForm.sellingPrice}
                  onChange={(e) => setOrderForm({...orderForm, sellingPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your selling price"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cost: ₹{selectedWholesalerProduct.price} | 
                  Suggested: ₹{(selectedWholesalerProduct.price * 1.2).toFixed(2)} (20% markup)
                </p>
              </div>

              {orderForm.quantity && orderForm.sellingPrice && (
                <div className="p-3 bg-blue-50 rounded-lg">
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
                  <div className="flex justify-between text-sm font-bold text-green-600 border-t border-blue-200 pt-1 mt-1">
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
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Confirm & Add
              </button>
              <button
                onClick={() => {
                  setShowAddFromWholesaler(false);
                  setSelectedWholesalerProduct(null);
                  setOrderForm({ quantity: '', sellingPrice: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
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