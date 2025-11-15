import { useState, useEffect } from 'react';
import { MapPin, Package, CheckCircle, Navigation, Phone } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_status: string;
  total_amount: number;
};

export default function DeliveryPartnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const deliveryPartnerId = 'demo-dp-123'; // Replace with actual auth user ID

  // Get current location
  useEffect(() => {
    if (navigator.geolocation && isOnline) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          
          // Update location in database
          if (selectedOrder) {
            updateDeliveryLocation(selectedOrder.id, location);
          }
        },
        (error) => {
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline, selectedOrder]);

  // Fetch assigned orders
  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', deliveryPartnerId);

      if (error) {
        console.error('Error fetching orders:', error);
      } else if (data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    }

    fetchOrders();
  }, [deliveryPartnerId]);

  // Update delivery location
  async function updateDeliveryLocation(orderId: string, location: { lat: number; lng: number }) {
    const { error } = await supabase.from('delivery_tracking').insert({
      order_id: orderId,
      delivery_partner_id: deliveryPartnerId,
      latitude: location.lat,
      longitude: location.lng,
      status: selectedOrder?.delivery_status
    });

    if (error) {
      console.error('Error updating location:', error);
    }
  }

  // Update order status
  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ delivery_status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      return;
    }

    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, delivery_status: newStatus } : order
      )
    );

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, delivery_status: newStatus } : null);
    }
  }

  // Start delivery
  function handleStartDelivery(order: Order) {
    setSelectedOrder(order);
    updateOrderStatus(order.id, 'out_for_delivery');
  }

  // Complete delivery
  function handleCompleteDelivery() {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'delivered');
      setSelectedOrder(null);
    }
  }

  // Open in Google Maps
  function openInMaps(lat: number, lng: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.delivery_status !== 'delivered');
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Delivery Dashboard</h1>
              <p className="text-green-100">Welcome back, Partner!</p>
            </div>
            
            <div className="flex items-center gap-4">
              {currentLocation && (
                <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">Location: Active</span>
                </div>
              )}
              
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  isOnline
                    ? 'bg-white text-green-600'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Orders</p>
                <p className="text-3xl font-bold text-blue-600">{activeOrders.length}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">{completedOrders.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Earnings Today</p>
                <p className="text-3xl font-bold text-purple-600">
                  ₹{orders.reduce((sum, o) => sum + o.total_amount * 0.1, 0).toFixed(0)}
                </p>
              </div>
              <span className="text-4xl opacity-20">💰</span>
            </div>
          </div>
        </div>

        {/* Current Delivery */}
        {selectedOrder && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-6 mb-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Navigation className="animate-pulse" />
              Current Delivery
            </h2>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Order Number</p>
                  <p className="font-bold text-lg">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Customer</p>
                  <p className="font-bold text-lg">{selectedOrder.customer_name}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm opacity-80">Delivery Address</p>
                  <p className="font-bold">{selectedOrder.delivery_address}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openInMaps(selectedOrder.delivery_lat, selectedOrder.delivery_lng)}
                className="flex-1 bg-white text-orange-600 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Open in Maps
              </button>
              
              <button
                onClick={() => window.open(`tel:${selectedOrder.customer_phone}`)}
                className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Customer
              </button>
              
              <button
                onClick={handleCompleteDelivery}
                className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Mark Delivered
              </button>
            </div>
          </div>
        )}

        {/* Active Orders List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Orders</h2>
          
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No active orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {order.order_number}
                        </span>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          {order.delivery_status}
                        </span>
                      </div>
                      
                      <p className="font-semibold text-gray-800 mb-1">
                        {order.customer_name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {order.delivery_address}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Amount: <span className="font-bold text-gray-800">₹{order.total_amount}</span>
                      </p>
                    </div>

                    {!selectedOrder && order.delivery_status !== 'out_for_delivery' && (
                      <button
                        onClick={() => handleStartDelivery(order)}
                        className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Start Delivery
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Completed Today</h2>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                    </div>
                  </div>
                  <span className="font-bold text-green-600">₹{order.total_amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}