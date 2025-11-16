import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Package, Truck, User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPartners();
  }, []);

  const fetchOrders = async () => {
    console.log('🔍 Fetching orders...');
    setLoading(true);
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        delivery_partner:delivery_partners(name, phone, vehicle_type)
      `)
      .in('delivery_status', ['pending', 'confirmed', 'preparing', 'out_for_delivery'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching orders:', error);
      alert('Error loading orders: ' + error.message);
    } else {
      console.log('✅ Fetched orders:', data?.length);
      setOrders(data || []);
    }
    setLoading(false);
  };

  const fetchDeliveryPartners = async () => {
    console.log('🔍 Fetching delivery partners...');
    
    const { data, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('is_available', true);

    if (error) {
      console.error('❌ Error loading partners:', error);
    } else {
      console.log('✅ Partners loaded:', data?.length);
      setDeliveryPartners(data || []);
    }
  };

  const assignDeliveryPartner = async (orderId: string, partnerId: string) => {
    if (processing) {
      console.log('⏳ Already processing...');
      return;
    }

    setProcessing(true);
    console.log('🚚 Assigning partner:', partnerId, 'to order:', orderId);
    
    try {
      // Step 1: Assign partner to order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          delivery_partner_id: partnerId,
          delivery_status: 'confirmed'
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Step 2: Mark partner as unavailable
      const { error: partnerError } = await supabase
        .from('delivery_partners')
        .update({ is_available: false })
        .eq('id', partnerId);

      if (partnerError) {
        console.warn('⚠️ Could not update partner availability:', partnerError);
      }

      console.log('✅ Assignment successful!');
      alert('✅ Delivery partner assigned successfully!');
      
      // Close modal and refresh data
      closeModal();
      await Promise.all([fetchOrders(), fetchDeliveryPartners()]);
      
    } catch (error: any) {
      console.error('❌ Assignment failed:', error);
      alert('Failed to assign partner: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (processing) {
      console.log('⏳ Already processing...');
      return;
    }

    setProcessing(true);
    console.log('🔄 Updating order', orderId, 'to status:', status);
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', orderId);

      if (error) throw error;

      console.log('✅ Status updated!');
      alert('✅ Order status updated successfully!');
      
      // Refresh orders
      await fetchOrders();
      
    } catch (error: any) {
      console.error('❌ Update failed:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const openAssignModal = (orderId: string) => {
    console.log('🎯 Opening modal for order:', orderId);
    
    if (deliveryPartners.length === 0) {
      alert('⚠️ No delivery partners available! Please add partners first.');
      return;
    }
    
    setSelectedOrder(orderId);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    console.log('❌ Closing modal');
    setSelectedOrder(null);
    document.body.style.overflow = 'unset';
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchOrders(), fetchDeliveryPartners()]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
              <p className="text-gray-600 mt-1">
                Available Delivery Partners: <strong className="text-blue-600">{deliveryPartners.length}</strong>
              </p>
            </div>
            <button
              onClick={refreshAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Debug Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 font-semibold mb-2">📊 System Status</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Orders: {orders.length}</p>
              <p>• Available Partners: {deliveryPartners.length}</p>
              <p>• Modal: {selectedOrder ? '🟢 OPEN' : '🔴 CLOSED'}</p>
              <p>• Processing: {processing ? '⏳ YES' : '✅ NO'}</p>
            </div>
          </div>

          {/* No Partners Warning */}
          {deliveryPartners.length === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm text-yellow-700 font-semibold">
                    No delivery partners available
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Add delivery partners to assign orders
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No Active Orders</h2>
              <p className="text-gray-500">All orders have been completed</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{order.order_number}</h3>
                      <p className="text-gray-600">👤 {order.customer_name}</p>
                      <p className="text-gray-600">📍 {order.delivery_address}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Total: <span className="font-bold text-gray-800">₹{order.total_price}</span>
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                      order.delivery_status === 'pending' ? 'bg-gray-100 text-gray-800' :
                      order.delivery_status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      order.delivery_status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {order.delivery_status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Delivery Partner Info */}
                  {order.delivery_partner ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-green-600" />
                        <div className="text-sm text-green-700">
                          <p className="font-semibold">{order.delivery_partner.name}</p>
                          <p>📞 {order.delivery_partner.phone}</p>
                          <p>🚗 {order.delivery_partner.vehicle_type}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-800 font-semibold">⚠️ No delivery partner assigned yet</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap">
                    {/* Accept Order Button */}
                    {order.delivery_status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        disabled={processing}
                        className="flex-1 min-w-[200px] bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        {processing ? 'Processing...' : 'Accept Order'}
                      </button>
                    )}

                    {/* Assign Partner Button */}
                    {!order.delivery_partner_id && order.delivery_status !== 'pending' && (
                      <button
                        onClick={() => openAssignModal(order.id)}
                        disabled={deliveryPartners.length === 0 || processing}
                        className="flex-1 min-w-[200px] bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <User className="w-4 h-4 inline mr-2" />
                        Assign Partner ({deliveryPartners.length})
                      </button>
                    )}

                    {/* Mark as Preparing */}
                    {order.delivery_status === 'confirmed' && order.delivery_partner_id && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={processing}
                        className="flex-1 min-w-[200px] bg-yellow-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Package className="w-4 h-4 inline mr-2" />
                        {processing ? 'Processing...' : 'Mark as Preparing'}
                      </button>
                    )}

                    {/* Out for Delivery */}
                    {order.delivery_status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                        disabled={processing}
                        className="flex-1 min-w-[200px] bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Truck className="w-4 h-4 inline mr-2" />
                        {processing ? 'Processing...' : 'Out for Delivery'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {selectedOrder && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '550px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                Select Delivery Partner
              </h2>
              <button
                onClick={closeModal}
                disabled={processing}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '8px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !processing && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              >
                ×
              </button>
            </div>

            {/* Partners List */}
            {deliveryPartners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <AlertCircle style={{ width: '56px', height: '56px', color: '#ef4444', margin: '0 auto 16px' }} />
                <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>
                  No partners available!
                </p>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Please add delivery partners to the system first.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {deliveryPartners.map((partner) => (
                  <button
                    key={partner.id}
                    onClick={() => {
                      console.log('✅ Selecting partner:', partner.name, partner.id);
                      assignDeliveryPartner(selectedOrder, partner.id);
                    }}
                    disabled={processing}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '18px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      backgroundColor: 'white',
                      opacity: processing ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        backgroundColor: '#dbeafe',
                        padding: '12px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User style={{ width: '26px', height: '26px', color: '#3b82f6' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: '#111827', marginBottom: '6px', fontSize: '16px' }}>
                          {partner.name}
                        </p>
                        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '3px' }}>
                          📞 {partner.phone}
                        </p>
                        <p style={{ fontSize: '14px', color: '#6b7280' }}>
                          🚗 {partner.vehicle_type}
                        </p>
                      </div>
                      <span style={{
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        padding: '6px 14px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        Available
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={closeModal}
              disabled={processing}
              style={{
                width: '100%',
                backgroundColor: '#f3f4f6',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                color: '#374151',
                opacity: processing ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => !processing && (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              {processing ? 'Processing...' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}