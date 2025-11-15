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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

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
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="py-1"><strong>Order ID:</strong> {order.id.slice(0, 8)}</p>
          <p className="py-1"><strong>Total:</strong> ₹{order.total_price}</p>
          <p className="py-1"><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
          <p className="py-1"><strong>Payment:</strong> <span className="capitalize">{order.payment_method}</span></p>
        </div>
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
    </div>
  );
}

export default OrderSuccess;