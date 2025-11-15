import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Package, Truck, User } from 'lucide-react';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  is_available: boolean;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  delivery_address: string;
  total_price: number;
  delivery_status: string;
  delivery_partner_id?: string;
  delivery_partner?: {
    name: string;
    phone: string;
    vehicle_type: string;
  };
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPartners();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        delivery_partner:delivery_partners(name, phone, vehicle_type)
      `)
      .in('delivery_status', ['confirmed', 'preparing', 'out_for_delivery'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchDeliveryPartners = async () => {
    const { data, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('is_available', true);

    if (error) {
      console.error('Error fetching delivery partners:', error);
    } else {
      setDeliveryPartners(data || []);
    }
  };

  const assignDeliveryPartner = async (orderId: string, partnerId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        delivery_partner_id: partnerId,
        delivery_status: 'confirmed'
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error assigning delivery partner:', error);
      alert('Failed to assign delivery partner');
    } else {
      alert('✅ Delivery partner assigned successfully!');
      setSelectedOrder(null);
      fetchOrders();
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } else {
      alert('✅ Order status updated!');
      fetchOrders();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Management</h1>

        {/* Orders List */}
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {order.order_number}
                  </h3>
                  <p className="text-gray-600">{order.delivery_address}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Total: ₹{order.total_price}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  order.delivery_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  order.delivery_status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                  order.delivery_status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.delivery_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Delivery Partner Info */}
              {order.delivery_partner ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Assigned to:</span>
                  </div>
                  <div className="ml-8 text-sm text-green-700">
                    <p className="font-semibold">{order.delivery_partner.name}</p>
                    <p>📞 {order.delivery_partner.phone}</p>
                    <p>🚗 {order.delivery_partner.vehicle_type}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-semibold">⚠️ No delivery partner assigned</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!order.delivery_partner_id && (
                  <button
                    onClick={() => setSelectedOrder(order.id)}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Assign Delivery Partner
                  </button>
                )}

                {order.delivery_status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Mark as Preparing
                  </button>
                )}

                {order.delivery_status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Mark as Out for Delivery
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Assign Delivery Partner Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Select Delivery Partner</h2>

              {deliveryPartners.length === 0 ? (
                <p className="text-gray-600 mb-4">No online delivery partners available</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {deliveryPartners.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => assignDeliveryPartner(selectedOrder, partner.id)}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{partner.name}</p>
                          <p className="text-sm text-gray-600">📞 {partner.phone}</p>
                          <p className="text-sm text-gray-600">🚗 {partner.vehicle_type}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}