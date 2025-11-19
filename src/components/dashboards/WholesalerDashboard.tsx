// src/components/dashboards/WholesalerDashboard.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url?: string;
  cost_price?: number;
  retailer_price?: number;
  wholesaler_id?: string;
  retailer_id?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Retailer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  status: string;
  created_at?: string;
}

interface RetailerOrder {
  id: string;
  retailer_id: string;
  retailer_name: string;
  wholesaler_id: string;
  items: any;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image_url: string;
}

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Home & Garden',
  'Sports & Outdoors',
  'Beauty & Personal Care',
  'Books & Stationery',
  'Toys & Games',
  'Automotive',
  'Health & Wellness',
  'Furniture',
  'Pet Supplies',
  'Other'
] as const;

export default function WholesalerDashboard() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'retailers' | 'transactions'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [transactions, setTransactions] = useState<RetailerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: ''
  });

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchData();
    }
  }, [currentUserId, activeTab]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'inventory') {
      await fetchProducts();
    } else if (activeTab === 'retailers') {
      await fetchRetailers();
    } else if (activeTab === 'transactions') {
      await fetchTransactions();
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    if (!currentUserId) return;

    console.log('Fetching products for wholesaler:', currentUserId);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('wholesaler_id', currentUserId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } else if (data) {
      console.log('Raw fetched products:', data);
      // CRITICAL: Filter to only show wholesaler's original inventory (retailer_id must be null)
      const wholesalerOnly = data.filter(p => p.retailer_id === null);
      console.log('Filtered to wholesaler-only products:', wholesalerOnly);
      setProducts(wholesalerOnly as Product[]);
    } else {
      setProducts([]);
    }
  };

  const fetchRetailers = async () => {
    if (!currentUserId) return;

    console.log('Fetching retailers for wholesaler:', currentUserId);

    // Get all retailer orders for this wholesaler
    const { data: orders, error: ordersError } = await supabase
      .from('retailer_orders')
      .select('retailer_id, retailer_name')
      .eq('wholesaler_id', currentUserId);

    if (ordersError) {
      console.error('Error fetching retailer orders:', ordersError);
      setRetailers([]);
      return;
    }

    console.log('Found orders:', orders);

    if (!orders || orders.length === 0) {
      console.log('No orders found');
      setRetailers([]);
      return;
    }

    // Get unique retailer auth_ids
    const retailerAuthIds = [...new Set(orders.map(o => o.retailer_id).filter(Boolean))];
    console.log('Unique retailer auth_ids:', retailerAuthIds);

    if (retailerAuthIds.length === 0) {
      setRetailers([]);
      return;
    }

    // CRITICAL FIX: Query by auth_id, not id
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, auth_id')
      .in('auth_id', retailerAuthIds);  // Changed from 'id' to 'auth_id'

    console.log('Users who placed orders:', users);

    if (!users || users.length === 0) {
      console.log('No matching users found');
      setRetailers([]);
      return;
    }

    const emails = users.map(u => u.email).filter(Boolean);
    console.log('Retailer emails:', emails);

    // Fetch retailer details from retailers table
    const { data: retailerData, error } = await supabase
      .from('retailers')
      .select('*')
      .in('email', emails)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching retailers:', error);
      setRetailers([]);
      return;
    }

    console.log('Matched retailers:', retailerData);
    setRetailers((retailerData || []) as Retailer[]);
  };

  const fetchTransactions = async () => {
    if (!currentUserId) return;

    console.log('Fetching transactions for wholesaler:', currentUserId);

    const { data, error } = await supabase
      .from('retailer_orders')
      .select('*')
      .eq('wholesaler_id', currentUserId)  // CRITICAL: Only this wholesaler's transactions
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } else if (data) {
      console.log('Fetched transactions:', data);
      console.log('Number of transactions:', data.length);
      setTransactions(data as RetailerOrder[]);
    } else {
      setTransactions([]);
    }
  };

  const handleAddProduct = async () => {
    if (!currentUserId) {
      alert('Please log in to add products');
      return;
    }

    if (!productForm.name || !productForm.category || !productForm.price || !productForm.stock) {
      alert('Please fill in all required fields');
      return;
    }

    const { error } = await supabase
      .from('products')
      .insert([{
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        image_url: productForm.image_url || null,
        wholesaler_id: currentUserId,
        retailer_id: null,
        is_deleted: false
      }]);

    if (!error) {
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        image_url: ''
      });
      setShowAddProduct(false);
      await fetchProducts();
      alert('Product added successfully! It is now available for retailers to order.');
    } else {
      console.error('Error adding product:', error);
      alert('Failed to add product. Check console for details.');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    if (!productForm.name || !productForm.category || !productForm.price || !productForm.stock) {
      alert('Please fill in all required fields');
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        image_url: productForm.image_url || null
      })
      .eq('id', editingProduct.id);

    if (!error) {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        image_url: ''
      });
      await fetchProducts();
      alert('Product updated successfully!');
    } else {
      console.error('Error updating product:', error);
      alert('Failed to update product. Check console for details.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product? It will no longer be available to retailers.')) {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (!error) {
        await fetchProducts();
        alert('Product deleted successfully!');
      } else {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Check console for details.');
      }
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      image_url: product.image_url || ''
    });
  };

  const updateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) {
      alert('Stock cannot be negative');
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (!error) {
      await fetchProducts();
    } else {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Check console for details.');
    }
  };

  const cancelForm = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image_url: ''
    });
  };

  if (loading && !currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Wholesaler Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Manage inventory, pricing, and retailer transactions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {(['inventory', 'retailers', 'transactions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                {tab === 'retailers' && retailers.length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                    {retailers.length}
                  </span>
                )}
                {tab === 'transactions' && transactions.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs">
                    {transactions.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Products you add here will be available for all retailers to order</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add New Product
                </button>
              </div>

              {(showAddProduct || editingProduct) && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Product Name *"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="border p-2 rounded"
                        required
                      />
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="border p-2 rounded"
                        required
                      >
                        <option value="">Select Category *</option>
                        {PRODUCT_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Wholesale Price (₹) *"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        className="border p-2 rounded"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock Quantity *"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        className="border p-2 rounded"
                        required
                      />
                      <input
                        type="url"
                        placeholder="Image URL (optional)"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                        className="border p-2 rounded col-span-2"
                      />
                      <textarea
                        placeholder="Description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        className="border p-2 rounded col-span-2"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                      <button
                        onClick={cancelForm}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.image_url && (
                              <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded mr-3 object-cover" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">₹{product.price}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={product.stock}
                              onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                              className="w-20 border rounded px-2 py-1 text-sm"
                              min="0"
                            />
                            <span className={`px-2 py-1 text-xs rounded ${
                              product.stock > 50 ? 'bg-green-100 text-green-800' :
                              product.stock > 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {product.stock > 50 ? 'In Stock' : product.stock > 10 ? 'Low' : 'Critical'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => startEditing(product)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No products yet.</p>
                    <p className="text-sm">Click "Add New Product" to create products that retailers can order.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'retailers' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Retailer Management</h2>
              {loading ? (
                <div className="text-center py-8">Loading retailers...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {retailers.map((retailer) => (
                    <div key={retailer.id} className="bg-white p-6 rounded-lg shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-xl">
                            {retailer.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-gray-900">{retailer.name}</h3>
                          <p className="text-sm text-gray-500">{retailer.email}</p>
                        </div>
                      </div>
                      {retailer.phone && (
                        <div className="text-sm text-gray-600 mb-2">
                          📞 {retailer.phone}
                        </div>
                      )}
                      {retailer.address && (
                        <div className="text-sm text-gray-600 mb-4">
                          📍 {retailer.address}
                        </div>
                      )}
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Total Orders:</span>
                          <span className="font-semibold">{retailer.total_orders}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="font-semibold">₹{Number(retailer.total_spent).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            retailer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {retailer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {retailers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No retailers have ordered from you yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>
              {loading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            #{transaction.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {transaction.retailer_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {Array.isArray(transaction.items) && transaction.items.length > 0 ? (
                              <div className="space-y-1">
                                {transaction.items.map((item: any, idx: number) => (
                                  <div key={idx}>
                                    {item.product_name} x{item.quantity}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                            ₹{Number(transaction.total_amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded ${
                              transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                              transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}