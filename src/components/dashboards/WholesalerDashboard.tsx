// src/components/dashboards/WholesalerDashboard.tsx - Updated with new color scheme
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
      const wholesalerOnly = data.filter(p => p.retailer_id === null);
      setProducts(wholesalerOnly as Product[]);
    } else {
      setProducts([]);
    }
  };

  const fetchRetailers = async () => {
    if (!currentUserId) return;

    const { data: orders, error: ordersError } = await supabase
      .from('retailer_orders')
      .select('retailer_id, retailer_name')
      .eq('wholesaler_id', currentUserId);

    if (ordersError) {
      console.error('Error fetching retailer orders:', ordersError);
      setRetailers([]);
      return;
    }

    if (!orders || orders.length === 0) {
      setRetailers([]);
      return;
    }

    const retailerAuthIds = [...new Set(orders.map(o => o.retailer_id).filter(Boolean))];

    if (retailerAuthIds.length === 0) {
      setRetailers([]);
      return;
    }

    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, auth_id')
      .in('auth_id', retailerAuthIds);

    if (!users || users.length === 0) {
      setRetailers([]);
      return;
    }

    const emails = users.map(u => u.email).filter(Boolean);

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

    setRetailers((retailerData || []) as Retailer[]);
  };

  const fetchTransactions = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('retailer_orders')
      .select('*')
      .eq('wholesaler_id', currentUserId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } else if (data) {
      setTransactions(data as RetailerOrder[]);
    } else {
      setTransactions([]);
    }
  };

  const handleAddProduct = async () => {
    if (!currentUserId || !productForm.name || !productForm.category || !productForm.price || !productForm.stock) {
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
      alert('Product added successfully!');
    } else {
      console.error('Error adding product:', error);
      alert('Failed to add product.');
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productForm.name || !productForm.category || !productForm.price || !productForm.stock) {
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
      alert('Failed to update product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
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
        alert('Failed to delete product.');
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
      alert('Failed to update stock.');
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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-foreground">Wholesaler Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage inventory, pricing, and retailer transactions</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {(['inventory', 'retailers', 'transactions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                {tab}
                {tab === 'retailers' && retailers.length > 0 && (
                  <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                    {retailers.length}
                  </span>
                )}
                {tab === 'transactions' && transactions.length > 0 && (
                  <span className="ml-2 bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
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
                  <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
                  <p className="text-sm text-muted-foreground mt-1">Products you add here will be available for all retailers to order</p>
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-[hsl(var(--primary-hover))] transition-all font-semibold"
                >
                  Add New Product
                </button>
              </div>

              {(showAddProduct || editingProduct) && (
                <div className="bg-card border border-border p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Product Name *"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="border border-input bg-background text-foreground p-2 rounded focus-primary transition-base"
                        required
                      />
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="border border-input bg-background text-foreground p-2 rounded focus-primary transition-base"
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
                        className="border border-input bg-background text-foreground p-2 rounded focus-primary transition-base"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock Quantity *"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        className="border border-input bg-background text-foreground p-2 rounded focus-primary transition-base"
                        required
                      />
                      <input
                        type="url"
                        placeholder="Image URL (optional)"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({...productForm, image_url: e.target.value})}
                        className="border border-input bg-background text-foreground p-2 rounded col-span-2 focus-primary transition-base"
                      />
                      <textarea
                        placeholder="Description"
                        value={productForm.description}
                        onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                        className="border border-input bg-background text-foreground p-2 rounded col-span-2 focus-primary transition-base"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-[hsl(var(--primary-hover))] transition-all font-semibold"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                      <button
                        onClick={cancelForm}
                        className="bg-muted text-foreground px-4 py-2 rounded hover:bg-muted/80 transition-all font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.image_url && (
                              <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded mr-3 object-cover" />
                            )}
                            <div>
                              <div className="font-medium text-foreground">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{product.category}</td>
                        <td className="px-6 py-4 text-sm text-foreground">₹{product.price}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={product.stock}
                              onChange={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                              className="w-20 border border-input bg-background text-foreground rounded px-2 py-1 text-sm focus-primary transition-base"
                              min="0"
                            />
                            <span className={`px-2 py-1 text-xs rounded ${
                              product.stock > 50 ? 'bg-accent/10 text-accent' :
                              product.stock > 10 ? 'alert-warning' :
                              'alert-warning'
                            }`}>
                              {product.stock > 50 ? 'In Stock' : product.stock > 10 ? 'Low' : 'Critical'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => startEditing(product)}
                            className="text-primary hover:text-[hsl(var(--link-hover))] mr-3 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-secondary hover:text-[hsl(var(--secondary-hover))] transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">No products yet.</p>
                    <p className="text-sm">Click "Add New Product" to create products that retailers can order.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'retailers' && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Retailer Management</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading retailers...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {retailers.map((retailer) => (
                    <div key={retailer.id} className="bg-card border border-border p-6 rounded-lg shadow-md">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold text-xl">
                            {retailer.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-foreground">{retailer.name}</h3>
                          <p className="text-sm text-muted-foreground">{retailer.email}</p>
                        </div>
                      </div>
                      {retailer.phone && (
                        <div className="text-sm text-muted-foreground mb-2">
                          📞 {retailer.phone}
                        </div>
                      )}
                      {retailer.address && (
                        <div className="text-sm text-muted-foreground mb-4">
                          📍 {retailer.address}
                        </div>
                      )}
                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Total Orders:</span>
                          <span className="font-semibold text-foreground">{retailer.total_orders}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Total Spent:</span>
                          <span className="font-semibold text-foreground">₹{Number(retailer.total_spent).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            retailer.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                          }`}>
                            {retailer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {retailers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No retailers have ordered from you yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Transaction History</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-muted-foreground">Loading transactions...</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Retailer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">
                            #{transaction.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground">
                            {transaction.retailer_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
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
                          <td className="px-6 py-4 text-sm text-foreground font-semibold">
                            ₹{Number(transaction.total_amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded ${
                              transaction.status === 'completed' ? 'bg-accent/10 text-accent' :
                              transaction.status === 'pending' ? 'alert-warning' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
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