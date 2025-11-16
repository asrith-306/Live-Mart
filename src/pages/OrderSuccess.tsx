import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

interface Order {
  id: string;
  customer_id: string;
  total_price: number;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  phone: string;
  created_at: string;
  delivery_date?: string;
}

function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate delivery date (7 days from order creation)
  const getDeliveryDate = () => {
    if (!order) return null;
    
    // Use delivery_date from database if available
    if (order.delivery_date) {
      return new Date(order.delivery_date);
    }
    
    // Otherwise calculate 7 days from order creation
    const orderDate = new Date(order.created_at);
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    return deliveryDate;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  const deliveryDate = getDeliveryDate();

  return (
    <div className="container mx-auto px-4 py-8 text-center max-w-md">
      <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-6">Thank you for your purchase</p>

      {order && (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <p className="py-1"><strong>Order ID:</strong> {order.id.slice(0, 8)}</p>
            <p className="py-1"><strong>Total:</strong> ₹{order.total_price}</p>
            <p className="py-1"><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
            <p className="py-1"><strong>Payment:</strong> <span className="capitalize">{order.payment_method}</span></p>
          </div>

          {/* DELIVERY DATE - HIGHLIGHTED BOX */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">📦</span>
              <p className="text-sm font-semibold text-blue-800">Expected Delivery Date</p>
            </div>
            {deliveryDate ? (
              <>
                <p className="font-bold text-xl text-blue-900 mb-1">
                  {formatDate(deliveryDate)}
                </p>
                <p className="text-sm text-blue-700 mb-2">
                  Time: 10:00 AM - 8:00 PM
                </p>
                <p className="text-xs text-gray-600">
                  ✅ Delivery within 7 days from order date
                </p>
              </>
            ) : (
              <p className="text-blue-700">Calculating delivery date...</p>
            )}
          </div>
        </>
      )}

      <div className="space-y-3">
        <button
          onClick={() => navigate('/orders')}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          View My Orders
        </button>
        <button
          onClick={() => navigate('/customer')}
          className="w-full bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          Continue Shopping
        </button>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          📧 You'll receive email reminders before delivery if you've connected Google Calendar
        </p>
      </div>
    </div>
  );
}

export default OrderSuccess;