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
  total_price: number; // Alternative field name
};

export default function DeliveryPartnerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deliveryPartnerId, setDeliveryPartnerId] = useState<string | null>(null);

  // Get logged-in delivery partner
  useEffect(() => {
    async function getDeliveryPartner() {
      console.log('🔍 Getting logged-in delivery partner...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No user logged in!');
        alert('Please log in as a delivery partner!');
        return;
      }

      console.log('✅ Logged in user:', user.id);
      
      // Fetch delivery partner record using auth_id
      const { data: partner, error } = await supabase
        .from('delivery_partners')
        .select('id, name')
        .eq('auth_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching delivery partner:', error);
        alert('You are not registered as a delivery partner! Error: ' + error.message);
        return;
      }

      if (partner) {
        console.log('✅ Found delivery partner:', partner.name, 'ID:', partner.id);
        setDeliveryPartnerId(partner.id);
      } else {
        console.error('❌ No delivery partner record found for this user');
        alert('No delivery partner profile found for your account!');
      }
    }

    getDeliveryPartner();
  }, []);

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
          if (selectedOrder && deliveryPartnerId) {
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
  }, [isOnline, selectedOrder, deliveryPartnerId]);

  // Fetch assigned orders
  useEffect(() => {
    if (!deliveryPartnerId) return;

    async function fetchOrders() {
      console.log('🔍 Fetching orders for delivery partner:', deliveryPartnerId);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', deliveryPartnerId)
        .in('delivery_status', ['confirmed', 'preparing', 'out_for_delivery', 'delivered']);

      if (error) {
        console.error('❌ Error fetching orders:', error);
      } else if (data) {
        console.log('✅ Found', data.length, 'orders');
        setOrders(data as Order[]);
      }
      setLoading(false);
    }

    fetchOrders();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('delivery-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `delivery_partner_id=eq.${deliveryPartnerId}`
        },
        (payload) => {
          console.log('📬 Order update received:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryPartnerId]);

  // Update delivery location
  async function updateDeliveryLocation(orderId: string, location: { lat: number; lng: number }) {
    if (!deliveryPartnerId) return;
    
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

    // If order is delivered, mark delivery partner as available again
    if (newStatus === 'delivered' && deliveryPartnerId) {
      console.log('✅ Marking delivery partner as available...');
      const { error: partnerError } = await supabase
        .from('delivery_partners')
        .update({ is_available: true })
        .eq('id', deliveryPartnerId);

      if (partnerError) {
        console.error('⚠️ Could not update partner availability:', partnerError);
      } else {
        console.log('✅ Delivery partner is now available for new orders!');
      }
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
  async function handleCompleteDelivery() {
    if (selectedOrder) {
      console.log('📦 Completing delivery for order:', selectedOrder.order_number);
      await updateOrderStatus(selectedOrder.id, 'delivered');
      
      // Show success message
      alert('✅ Delivery completed successfully! You are now available for new orders.');
      
      setSelectedOrder(null);
    }
  }

  // Open in Google Maps
  function openInMaps(lat: number, lng: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }

  if (loading || !deliveryPartnerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!deliveryPartnerId ? 'Verifying delivery partner...' : 'Loading orders...'}
          </p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.delivery_status !== 'delivered');
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');
  
  // Helper function to get order amount
  const getOrderAmount = (order: Order) => {
    return order.total_amount || order.total_price || 0;
  };
  
  // Calculate earnings (₹500 per delivery)
  const earningsPerDelivery = 500;
  const totalEarnings = completedOrders.length * earningsPerDelivery;

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
        {/* Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-blue-800 mb-2">📊 System Status</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Delivery Partner ID: {deliveryPartnerId}</p>
            <p>• Total Orders: {orders.length}</p>
            <p>• Active Orders: {activeOrders.length}</p>
            <p>• Completed Orders: {completedOrders.length}</p>
            <p>• Location Tracking: {currentLocation ? '🟢 Active' : '🔴 Disabled'}</p>
          </div>
        </div>

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
                <p className="text-3xl font-bold text-purple-600">₹{totalEarnings}</p>
                <p className="text-xs text-gray-400 mt-1">₹{earningsPerDelivery} per delivery</p>
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
              <p>No active orders assigned yet</p>
              <p className="text-sm mt-2">Orders will appear here when assigned by retailer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-2 border-blue-200 rounded-lg p-5 hover:border-blue-400 hover:shadow-lg transition-all bg-gradient-to-r from-blue-50 to-white"
                >
                  <div className="flex flex-col gap-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">
                          {order.order_number || 'N/A'}
                        </span>
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          order.delivery_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.delivery_status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          order.delivery_status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.delivery_status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Customer Name</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {order.customer_name || 'Unknown Customer'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                        <p className="font-semibold text-gray-700">
                          📞 {order.customer_phone || 'Not available'}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                      <div className="flex items-start gap-2 bg-white p-3 rounded-lg border border-gray-200">
                        <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 font-medium">
                          {order.delivery_address || 'Address not available'}
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                      <span className="text-sm text-gray-600">Order Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{getOrderAmount(order)}
                      </span>
                    </div>
                    
                    {/* Delivery Fee */}
                    <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <span className="text-sm text-gray-600">Your Delivery Fee:</span>
                      <span className="text-lg font-bold text-purple-600">
                        ₹{earningsPerDelivery}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-2">
                      {order.delivery_status === 'out_for_delivery' ? (
                        <>
                          <button
                            onClick={() => order.delivery_lat && order.delivery_lng && openInMaps(order.delivery_lat, order.delivery_lng)}
                            className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-5 h-5" />
                            Navigate
                          </button>
                          <button
                            onClick={() => order.customer_phone && window.open(`tel:${order.customer_phone}`)}
                            className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Phone className="w-5 h-5" />
                            Call
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="flex-1 bg-purple-500 text-white font-semibold py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Complete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartDelivery(order)}
                          className="w-full bg-green-500 text-white font-semibold py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Navigation className="w-5 h-5" />
                          Start Delivery
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Completed Today</h2>
              <div className="bg-purple-100 px-4 py-2 rounded-lg">
                <span className="text-purple-800 font-bold">Total Earned: ₹{totalEarnings}</span>
              </div>
            </div>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">Order: ₹{getOrderAmount(order)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Delivery Fee</p>
                    <span className="font-bold text-green-600 text-lg">₹{earningsPerDelivery}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}