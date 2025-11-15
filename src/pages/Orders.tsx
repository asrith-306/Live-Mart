import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

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
  delivery_status?: string; // Added delivery_status field
  estimated_delivery?: string; // Added estimated delivery time
  order_items?: OrderItem[];
}

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      dispatched: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // New function to get delivery status color and icon
  const getDeliveryStatusInfo = (deliveryStatus?: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: string }> = {
      pending: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: Clock, 
        label: 'Pending' 
      },
      confirmed: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle, 
        label: 'Confirmed' 
      },
      preparing: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Package, 
        label: 'Preparing' 
      },
      out_for_delivery: { 
        color: 'bg-purple-100 text-purple-800', 
        icon: Truck, 
        label: 'Out for Delivery' 
      },
      delivered: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        label: 'Delivered' 
      },
      cancelled: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle, 
        label: 'Cancelled' 
      }
    };

    return statusMap[deliveryStatus || 'pending'] || statusMap.pending;
  };

  // Check if order can be tracked (has delivery status and is not delivered/cancelled)
  const canTrackOrder = (order: Order): boolean => {
    const trackableStatuses = ['confirmed', 'preparing', 'out_for_delivery'];
    return trackableStatuses.includes(order.delivery_status || '');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col items-center justify-center">
        <Package className="w-20 h-20 text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold mb-4">No Orders Yet</h1>
        <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
        <button
          onClick={() => navigate('/customer')}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">My Orders</h1>

        <div className="space-y-6">
          {orders.map(order => {
            const deliveryInfo = getDeliveryStatusInfo(order.delivery_status);
            const DeliveryIcon = deliveryInfo.icon;
            const isTrackable = canTrackOrder(order);

            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-blue-100 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)} bg-white`}>
                        {order.status.toUpperCase()}
                      </span>
                      {order.delivery_status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${deliveryInfo.color} bg-white flex items-center gap-1`}>
                          <DeliveryIcon className="w-3 h-3" />
                          {deliveryInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  {/* Order Items */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Items Ordered
                    </h3>
                    <div className="space-y-2">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-3 rounded">
                          <span className="text-gray-700">
                            <span className="font-medium">{item.product_name}</span>
                            <span className="text-gray-500"> × {item.quantity}</span>
                          </span>
                          <span className="font-semibold text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">₹{order.total_price}</span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-600 min-w-[100px]">💳 Payment:</span>
                      <span className="text-gray-800">
                        {order.payment_method} 
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.payment_status}
                        </span>
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-600 min-w-[100px]">📍 Delivery:</span>
                      <span className="text-gray-800">{order.delivery_address}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-gray-600 min-w-[100px]">📞 Phone:</span>
                      <span className="text-gray-800">{order.phone}</span>
                    </div>

                    {order.estimated_delivery && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-600 min-w-[100px]">⏰ ETA:</span>
                        <span className="text-gray-800">{order.estimated_delivery}</span>
                      </div>
                    )}
                  </div>

                  {/* Track Order Button */}
                  {isTrackable && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => navigate(`/track-order/${order.id}`)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <MapPin className="w-5 h-5" />
                        Track Order in Real-Time
                      </button>
                    </div>
                  )}

                  {order.delivery_status === 'delivered' && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-800">Order Delivered!</p>
                          <p className="text-sm text-green-700">Thank you for shopping with us.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Orders;