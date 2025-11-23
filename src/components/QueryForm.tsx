// src/components/QueryForm.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createQuery, QueryPriority } from '@/services/queryService';
import { supabase } from '@/utils/supabaseClient';

interface QueryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Order {
  id: string;
  order_number: string;
}

interface Product {
  id: string;
  name: string;
}

const QueryForm = ({ onClose, onSuccess }: QueryFormProps) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium' as QueryPriority,
    orderId: '',
    productId: ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrdersAndProducts();
  }, []);

  const loadOrdersAndProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        setLoading(false);
        return;
      }

      console.log('✅ User authenticated:', user.id);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('❌ Error fetching user:', userError);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.log('❌ No user data found');
        setLoading(false);
        return;
      }

      console.log('✅ User ID from users table:', userData.id);

      // Fetch user's orders with detailed error logging
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, customer_id')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
        console.error('Error details:', {
          message: ordersError.message,
          details: ordersError.details,
          hint: ordersError.hint,
          code: ordersError.code
        });
      } else {
        console.log('✅ Orders query successful');
        console.log('📦 Orders fetched:', ordersData);
        console.log('📊 Number of orders:', ordersData?.length || 0);
        setOrders(ordersData || []);
      }

      // Fetch available products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_deleted', false)
        .order('name')
        .limit(50);

      if (productsError) {
        console.error('❌ Error fetching products:', productsError);
      } else {
        console.log('✅ Products fetched:', productsData?.length || 0, 'products');
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createQuery(
        formData.subject.trim(),
        formData.message.trim(),
        formData.priority,
        formData.orderId || undefined,
        formData.productId || undefined
      );
      alert('Query submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting query:', error);
      alert('Failed to submit query. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Submit New Query</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Loading form data...</p>
            </div>
          ) : (
            <>
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={submitting}
              maxLength={200}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={6}
              required
              disabled={submitting}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as QueryPriority[]).map((priority) => (
                <label
                  key={priority}
                  className={`flex-1 cursor-pointer ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as QueryPriority })}
                    className="sr-only"
                    disabled={submitting}
                  />
                  <div className={`p-3 border-2 rounded-lg text-center font-medium transition-all ${
                    formData.priority === priority
                      ? priority === 'high'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : priority === 'medium'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Related Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related to Order (Optional)
            </label>
            {orders.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                📦 You don't have any orders yet. Place an order to link it to a query.
              </div>
            ) : (
              <select
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="">None - General query</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.order_number}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Related Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related to Product (Optional)
            </label>
            {products.length === 0 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                🛍️ No products available to select at the moment.
              </div>
            ) : (
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="">None - General query</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting || loading}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                submitting || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Query'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                submitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
          </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default QueryForm;