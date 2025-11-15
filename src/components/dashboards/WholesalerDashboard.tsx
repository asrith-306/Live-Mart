import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

export default function WholesalerDashboard() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProducts(),
      fetchRetailers(),
      fetchTransactions()
    ]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchRetailers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'retailer');
    
    if (!error && data) {
      setRetailers(data);
    }
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(name, email),
        order_items(*, product:products(name))
      `)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTransactions(data);
    }
  };

  const handleAddProduct = async () => {
    const { error } = await supabase
      .from('products')
      .insert([{
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        image_url: productForm.image_url
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
      fetchProducts();
    }
  };

  const handleUpdateProduct = async () => {
    const { error } = await supabase
      .from('products')
      .update({
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        category: productForm.category,
        image_url: productForm.image_url
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
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchProducts();
      }
    }
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      image_url: product.image_url || ''
    });
  };

  const updateStock = async (productId, newStock) => {
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (!error) {
      fetchProducts();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Wholesaler Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Manage inventory, pricing, and retailer transactions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {['inventory', 'retailers', 'transactions'].map((tab) => (
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
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add New Product
                </button>
              </div>

              {/* Add/Edit Product Form */}
              {(showAddProduct || editingProduct) && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Product Name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="border p-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="border p-2 rounded"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        className="border p-2 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Stock Quantity"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        className="border p-2 rounded"
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
                        rows="3"
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

              {/* Products List */}
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
                              <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded mr-3" />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">${product.price}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={product.stock}
                              onChange={(e) => updateStock(product.id, parseInt(e.target.value))}
                              className="w-20 border rounded px-2 py-1 text-sm"
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
              </div>
            </div>
          )}

          {/* Retailers Tab */}
          {activeTab === 'retailers' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Retailer Management</h2>
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
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Total Orders:</span>
                        <span className="font-semibold">
                          {transactions.filter(t => t.user_id === retailer.id).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Spent:</span>
                        <span className="font-semibold">
                          ${transactions
                            .filter(t => t.user_id === retailer.id)
                            .reduce((sum, t) => sum + (t.total_amount || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h2>
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
                          {transaction.user?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.order_items?.length || 0} items
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ${transaction.total_amount?.toFixed(2) || '0.00'}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}