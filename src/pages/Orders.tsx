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
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  phone: string;
  created_at: string;
  delivery_status: string;
  estimated_delivery?: string;
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

  const getStatusInfo = (deliveryStatus: string) => {
    const statusMap: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
      pending: { color: 'text-[#6B7A8F] dark:text-[#8A99AA]', bgColor: 'bg-[#EDF2F7] dark:bg-[#1A2332]', icon: Clock, label: 'Pending' },
      confirmed: { color: 'text-[#4A9FBE] dark:text-[#6BB3CF]', bgColor: 'bg-[#EEF5F7] dark:bg-[#1A2332]', icon: CheckCircle, label: 'Confirmed' },
      preparing: { color: 'text-[#D4A855]', bgColor: 'bg-[#F5E3E3] dark:bg-[#1A2332]', icon: Package, label: 'Preparing' },
      out_for_delivery: { color: 'text-[#6B7A8F] dark:text-[#8A99AA]', bgColor: 'bg-[#EDF2F7] dark:bg-[#1A2332]', icon: Truck, label: 'Out for Delivery' },
      delivered: { color: 'text-[#3A6B56] dark:text-[#B8E6D5]', bgColor: 'bg-[#D9EDE5] dark:bg-[#1A2332]', icon: CheckCircle, label: 'Delivered' },
      cancelled: { color: 'text-[#8A4A4A] dark:text-[#E8C0C0]', bgColor: 'bg-[#F5E3E3] dark:bg-[#1A2332]', icon: XCircle, label: 'Cancelled' }
    };
    return statusMap[deliveryStatus] || statusMap.pending;
  };

  const canTrackOrder = (order: Order): boolean => {
    const trackableStatuses = ['confirmed', 'preparing', 'out_for_delivery'];
    return trackableStatuses.includes(order.delivery_status);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A9FBE] dark:border-[#6BB3CF] mx-auto mb-4"></div>
          <p className="text-[#6B7A8F] dark:text-[#8A99AA]">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332]">
        <Package className="w-20 h-20 text-[#6B7A8F] dark:text-[#8A99AA] mb-4" />
        <h1 className="text-3xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-4">No Orders Yet</h1>
        <p className="text-[#6B7A8F] dark:text-[#8A99AA] mb-6">Start shopping to see your orders here</p>
        <button onClick={() => navigate('/customer')} className="bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white px-6 py-3 rounded-lg hover:bg-[#3A7C96] dark:hover:bg-[#8AC5DC] transition-colors font-semibold">
          Start Shopping
        </button>
      </div>
    );
  }

  console.log('Orders component rendering. Number of orders:', orders.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332] py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-[#2C3847] dark:text-[#E5E9EF]">My Orders</h1>

        <div className="space-y-6">
          {orders.map(order => {
            const statusInfo = getStatusInfo(order.delivery_status);
            const StatusIcon = statusInfo.icon;
            const isTrackable = canTrackOrder(order);
            const isDelivered = order.delivery_status === 'delivered';

            return (
              <div key={order.id} className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-[#D8DEE6] dark:border-[#3A4555]">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#6BB3CF] dark:to-[#5AA5B0] text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-[#EEF5F7] mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1.5`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  {/* Order Items */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-[#4A5568] dark:text-[#D1D8E0] mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Items Ordered
                    </h3>
                    <div className="space-y-2">
                      {order.order_items?.map(item => (
                        <div key={item.id} className="bg-[#EDF2F7] dark:bg-[#1A2332] p-3 rounded">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-[#4A5568] dark:text-[#D1D8E0]">
                              <span className="font-medium">{item.product_name}</span>
                              <span className="text-[#6B7A8F] dark:text-[#8A99AA]"> × {item.quantity}</span>
                            </span>
                            <span className="font-semibold text-[#2C3847] dark:text-[#E5E9EF]">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-[#D8DEE6] dark:border-[#3A4555] pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-[#2C3847] dark:text-[#E5E9EF]">Total Amount:</span>
                      <span className="text-2xl font-bold text-[#4A9FBE] dark:text-[#6BB3CF]">₹{order.total_price}</span>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-[#6B7A8F] dark:text-[#8A99AA] min-w-[100px]">💳 Payment:</span>
                      <span className="text-[#2C3847] dark:text-[#E5E9EF]">
                        {order.payment_method} 
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          order.payment_status === 'paid' 
                            ? 'bg-[#D9EDE5] dark:bg-[#1A2332] text-[#3A6B56] dark:text-[#B8E6D5]' 
                            : 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#D4A855]'
                        }`}>
                          {order.payment_status}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-[#6B7A8F] dark:text-[#8A99AA] min-w-[100px]">📍 Delivery:</span>
                      <span className="text-[#2C3847] dark:text-[#E5E9EF]">{order.delivery_address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-[#6B7A8F] dark:text-[#8A99AA] min-w-[100px]">📞 Phone:</span>
                      <span className="text-[#2C3847] dark:text-[#E5E9EF]">{order.phone}</span>
                    </div>
                    {order.estimated_delivery && (
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-[#6B7A8F] dark:text-[#8A99AA] min-w-[100px]">⏰ ETA:</span>
                        <span className="text-[#2C3847] dark:text-[#E5E9EF]">{order.estimated_delivery}</span>
                      </div>
                    )}
                  </div>

                  {/* Track Order Button */}
                  {isTrackable && (
                    <div className="mt-6 pt-4 border-t border-[#D8DEE6] dark:border-[#3A4555]">
                      <button
                        onClick={() => navigate(`/track-order/${order.id}`)}
                        className="w-full bg-gradient-to-r from-[#4A9FBE] to-[#5AA5B0] dark:from-[#6BB3CF] dark:to-[#5AA5B0] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#3A7C96] hover:to-[#4A9FBE] dark:hover:from-[#8AC5DC] dark:hover:to-[#6BB3CF] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <MapPin className="w-5 h-5" />
                        Track Order in Real-Time
                      </button>
                    </div>
                  )}

                  {/* Delivered Section */}
                  {isDelivered && (
                    <div className="mt-6 pt-4 border-t border-[#D8DEE6] dark:border-[#3A4555]">
                      <div className="bg-[#D9EDE5] dark:bg-[#1A2332] border border-[#5FA889] dark:border-[#3A4555] rounded-lg p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-[#5FA889] dark:text-[#7DBFA0] flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-[#3A6B56] dark:text-[#B8E6D5]">Order Delivered!</p>
                          <p className="text-sm text-[#3A6B56] dark:text-[#B8E6D5]">Thank you for shopping with us. You can review products from the shop page.</p>
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