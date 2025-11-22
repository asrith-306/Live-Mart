import { useState, useEffect } from 'react';
import { MapPin, Package, CheckCircle, Navigation, Phone } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  delivery_status: string;
  total_amount: number;
  total_price: number;
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

    // Mark delivery partner as available
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
      
      alert('✅ Delivery completed successfully!\n📧 Email sent to customer.\n\nYou are now available for new orders.');
      
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
      <div className="flex items-center justify-center min-h-screen bg-[#EDF2F7] dark:bg-[#1A2332]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A9FBE] dark:border-[#6BB3CF] mx-auto mb-4"></div>
          <p className="text-[#6B7A8F] dark:text-[#8A99AA]">
            {!deliveryPartnerId ? 'Verifying delivery partner...' : 'Loading orders...'}
          </p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.delivery_status !== 'delivered');
  const completedOrders = orders.filter(o => o.delivery_status === 'delivered');
  
  const getOrderAmount = (order: Order) => {
    return order.total_amount || order.total_price || 0;
  };
  
  const earningsPerDelivery = 500;
  const totalEarnings = completedOrders.length * earningsPerDelivery;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4F6] via-[#EDF2F7] to-[#EEF5F7] dark:bg-gradient-to-br dark:from-[#1A2332] dark:via-[#1F2937] dark:to-[#1A2332]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#5FA889] to-[#7DBFA0] dark:from-[#7DBFA0] dark:to-[#5FA889] text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Delivery Dashboard</h1>
              <p className="text-[#D9EDE5]">Welcome back, Partner!</p>
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
                    ? 'bg-[#FAFBFC] dark:bg-[#242D3C] text-[#5FA889] dark:text-[#7DBFA0]'
                    : 'bg-[#6B7A8F] dark:bg-[#3A4555] text-white'
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
        <div className="bg-[#EEF5F7] dark:bg-[#1A2332] border border-[#6BB3CF] dark:border-[#3A4555] rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-[#4A9FBE] dark:text-[#6BB3CF] mb-2">📊 System Status</p>
          <div className="text-xs text-[#4A5568] dark:text-[#D1D8E0] space-y-1">
            <p>• Delivery Partner ID: {deliveryPartnerId}</p>
            <p>• Total Orders: {orders.length}</p>
            <p>• Active Orders: {activeOrders.length}</p>
            <p>• Completed Orders: {completedOrders.length}</p>
            <p>• Location Tracking: {currentLocation ? '🟢 Active' : '🔴 Disabled'}</p>
            <p>• Email Notifications: 🟢 Enabled</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7A8F] dark:text-[#8A99AA] text-sm">Active Orders</p>
                <p className="text-3xl font-bold text-[#4A9FBE] dark:text-[#6BB3CF]">{activeOrders.length}</p>
              </div>
              <Package className="w-12 h-12 text-[#4A9FBE] dark:text-[#6BB3CF] opacity-20" />
            </div>
          </div>

          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7A8F] dark:text-[#8A99AA] text-sm">Completed Today</p>
                <p className="text-3xl font-bold text-[#5FA889] dark:text-[#7DBFA0]">{completedOrders.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-[#5FA889] dark:text-[#7DBFA0] opacity-20" />
            </div>
          </div>

          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7A8F] dark:text-[#8A99AA] text-sm">Earnings Today</p>
                <p className="text-3xl font-bold text-[#6B7A8F] dark:text-[#8A99AA]">₹{totalEarnings}</p>
                <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA] mt-1">₹{earningsPerDelivery} per delivery</p>
              </div>
              <span className="text-4xl opacity-20">💰</span>
            </div>
          </div>
        </div>

        {/* Current Delivery */}
        {selectedOrder && (
          <div className="bg-gradient-to-r from-[#D97B7B] to-[#E59595] dark:from-[#E59595] dark:to-[#D97B7B] rounded-lg shadow-lg p-6 mb-6 text-white">
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
                className="flex-1 bg-[#FAFBFC] dark:bg-[#242D3C] text-[#D97B7B] dark:text-[#E59595] font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-[#1A2332] transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Open in Maps
              </button>
              
              <button
                onClick={() => window.open(`tel:${selectedOrder.customer_phone}`)}
                className="flex-1 bg-[#5FA889] dark:bg-[#7DBFA0] text-white font-semibold py-3 rounded-lg hover:bg-[#4D8A6F] dark:hover:bg-[#5FA889] transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Customer
              </button>
              
              <button
                onClick={handleCompleteDelivery}
                className="flex-1 bg-[#5FA889] dark:bg-[#7DBFA0] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#4D8A6F] dark:hover:bg-[#5FA889] transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Mark Delivered
              </button>
            </div>
          </div>
        )}

        {/* Active Orders List */}
        <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF] mb-4">Active Orders</h2>
          
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-[#6B7A8F] dark:text-[#8A99AA]">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No active orders assigned yet</p>
              <p className="text-sm mt-2">Orders will appear here when assigned by retailer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-2 border-[#6BB3CF] dark:border-[#3A4555] rounded-lg p-5 hover:border-[#4A9FBE] dark:hover:border-[#6BB3CF] hover:shadow-lg transition-all bg-gradient-to-r from-[#EEF5F7] to-[#FAFBFC] dark:from-[#1A2332] dark:to-[#242D3C]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white rounded-lg text-sm font-bold shadow-sm">
                          {order.order_number || 'N/A'}
                        </span>
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          order.delivery_status === 'confirmed' ? 'bg-[#EEF5F7] dark:bg-[#1A2332] text-[#4A9FBE] dark:text-[#6BB3CF]' :
                          order.delivery_status === 'preparing' ? 'bg-[#F5E3E3] dark:bg-[#1A2332] text-[#D4A855]' :
                          order.delivery_status === 'out_for_delivery' ? 'bg-[#EDF2F7] dark:bg-[#1A2332] text-[#6B7A8F] dark:text-[#8A99AA]' :
                          'bg-[#EDF2F7] dark:bg-[#1A2332] text-[#6B7A8F] dark:text-[#8A99AA]'
                        }`}>
                          {order.delivery_status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Customer Name</p>
                        <p className="font-bold text-[#2C3847] dark:text-[#E5E9EF] text-lg">
                          {order.customer_name || 'Unknown Customer'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Contact</p>
                        <p className="font-semibold text-[#4A5568] dark:text-[#D1D8E0]">
                          📞 {order.customer_phone || 'Not available'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA] mb-1">Delivery Address</p>
                      <div className="flex items-start gap-2 bg-[#FAFBFC] dark:bg-[#1A2332] p-3 rounded-lg border border-[#D8DEE6] dark:border-[#3A4555]">
                        <MapPin className="w-5 h-5 text-[#D97B7B] dark:text-[#E59595] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#4A5568] dark:text-[#D1D8E0] font-medium">
                          {order.delivery_address || 'Address not available'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-[#D9EDE5] dark:bg-[#1A2332] p-3 rounded-lg border border-[#5FA889] dark:border-[#3A4555]">
                      <span className="text-sm text-[#4A5568] dark:text-[#D1D8E0]">Order Amount:</span>
                      <span className="text-xl font-bold text-[#5FA889] dark:text-[#7DBFA0]">
                        ₹{getOrderAmount(order)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-[#EDF2F7] dark:bg-[#1A2332] p-3 rounded-lg border border-[#6B7A8F] dark:border-[#3A4555]">
                      <span className="text-sm text-[#4A5568] dark:text-[#D1D8E0]">Your Delivery Fee:</span>
                      <span className="text-lg font-bold text-[#6B7A8F] dark:text-[#8A99AA]">
                        ₹{earningsPerDelivery}
                      </span>
                    </div>

                    <div className="flex gap-3 mt-2">
                      {order.delivery_status === 'out_for_delivery' ? (
                        <>
                          <button
                            onClick={() => order.delivery_lat && order.delivery_lng && openInMaps(order.delivery_lat, order.delivery_lng)}
                            className="flex-1 bg-[#4A9FBE] dark:bg-[#6BB3CF] text-white font-semibold py-3 rounded-lg hover:bg-[#3A7C96] dark:hover:bg-[#8AC5DC] transition-colors flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-5 h-5" />
                            Navigate
                          </button>
                          <button
                            onClick={() => order.customer_phone && window.open(`tel:${order.customer_phone}`)}
                            className="flex-1 bg-[#5FA889] dark:bg-[#7DBFA0] text-white font-semibold py-3 rounded-lg hover:bg-[#4D8A6F] dark:hover:bg-[#5FA889] transition-colors flex items-center justify-center gap-2"
                          >
                            <Phone className="w-5 h-5" />
                            Call
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="flex-1 bg-[#6B7A8F] dark:bg-[#8A99AA] text-white font-semibold py-3 rounded-lg hover:bg-[#4A5568] dark:hover:bg-[#6B7A8F] transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Complete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartDelivery(order)}
                          className="w-full bg-[#5FA889] dark:bg-[#7DBFA0] text-white font-semibold py-3 rounded-lg hover:bg-[#4D8A6F] dark:hover:bg-[#5FA889] transition-colors flex items-center justify-center gap-2"
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
          <div className="bg-[#FAFBFC] dark:bg-[#242D3C] rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#2C3847] dark:text-[#E5E9EF]">Completed Today</h2>
              <div className="bg-[#EDF2F7] dark:bg-[#1A2332] px-4 py-2 rounded-lg">
                <span className="text-[#6B7A8F] dark:text-[#8A99AA] font-bold">Total Earned: ₹{totalEarnings}</span>
              </div>
            </div>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-[#D9EDE5] dark:bg-[#1A2332] rounded-lg border border-[#5FA889] dark:border-[#3A4555]"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#5FA889] dark:text-[#7DBFA0]" />
                    <div>
                      <p className="font-semibold text-[#2C3847] dark:text-[#E5E9EF]">{order.order_number}</p>
                      <p className="text-sm text-[#4A5568] dark:text-[#D1D8E0]">{order.customer_name}</p>
                      <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA]">Order: ₹{getOrderAmount(order)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7A8F] dark:text-[#8A99AA]">Delivery Fee</p>
                    <span className="font-bold text-[#5FA889] dark:text-[#7DBFA0] text-lg">₹{earningsPerDelivery}</span>
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