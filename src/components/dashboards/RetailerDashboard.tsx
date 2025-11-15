// src/components/dashboards/RetailerDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchProducts, 
  fetchDeletedProducts,
  addProduct, 
  updateProduct, 
  deleteProduct,
  restoreProduct,
  permanentlyDeleteProduct,
  Product 
} from '@/services/productService';
import ProductCard from '@/components/products/ProductCard';
import ProductForm from '@/components/products/ProductForm';
import { Package, ShoppingCart, Truck } from 'lucide-react';

const RetailerDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, [viewMode]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = viewMode === 'active' 
        ? await fetchProducts() 
        : await fetchDeletedProducts();
      console.log('Loaded products:', data);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      alert('Failed to load products. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      console.log('Adding new product:', product);
      await addProduct(product);
      setShowForm(false);
      await loadProducts();
      alert('Product added successfully!');
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
    console.log('Delete button clicked for product ID:', id);
    
    if (!id) {
      console.error('No product ID provided');
      alert('Error: No product ID');
      return;
    }

    if (!window.confirm('Move this product to trash?')) {
      console.log('Delete cancelled by user');
      return;
    }
    
    try {
      console.log('Proceeding with delete for ID:', id);
      await deleteProduct(id);
      console.log('Delete completed, reloading products...');
      await loadProducts();
      alert('Product moved to trash!');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product. Check console for details.');
    }
  };

  const handleRestoreProduct = async (id: string) => {
    console.log('Restore button clicked for product ID:', id);
    
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
    console.log('Permanent delete clicked for product ID:', id);
    
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
    console.log('Editing product:', product);
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
      {/* Quick Actions Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-white text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onClick={() => setShowForm(true)}
              className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              + Add Product
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
              className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
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
              className="w-full bg-white text-green-600 py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
            >
              Manage Delivery
            </button>
          </div>
        </div>
      </div>

      {/* Header with View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Product Inventory</h1>
          
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
              Active Products
            </button>
            <button
              onClick={() => setViewMode('trash')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'trash' 
                  ? 'bg-white text-red-600 font-semibold shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🗑️ Trash ({products.length})
            </button>
          </div>
        </div>

        {/* Add Product Button (only in active view) */}
        {viewMode === 'active' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={viewMode === 'active' ? handleEdit : undefined}
            onDelete={viewMode === 'active' ? handleDeleteProduct : undefined}
            onRestore={viewMode === 'trash' ? handleRestoreProduct : undefined}
            onPermanentDelete={viewMode === 'trash' ? handlePermanentDelete : undefined}
            isRetailer={true}
            isTrashView={viewMode === 'trash'}
          />
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          {viewMode === 'active' 
            ? 'No products found. Click "Add Product" to get started!'
            : 'Trash is empty. Deleted products will appear here.'}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default RetailerDashboard;